"use client";

import Image from "next/image";
import { 
  FaLinkedin, 
  FaExternalLinkAlt, 
  FaCode, 
  FaProjectDiagram, 
  FaServicestack, 
  FaEnvelope, 
  FaMobileAlt, 
  FaUser, 
  FaComment, 
  FaPaperPlane,
  FaRobot,
  FaBars,
  FaTimes,
  FaPhone, FaFacebook, FaInstagram, FaTwitter
} from "react-icons/fa";
import { Sun, Moon } from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { addComment, getComments } from "../lib/db";
import { db } from "../lib/db"; 
import { collection, addDoc, getDocs } from "../lib/ratingsdb";
import { addRating, getRatings } from "../lib/ratingsdb";
import { web } from "../lib/web";
import styled from "styled-components";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link as ScrollLink } from "react-scroll";


const HeaderWrapper = styled(motion.header)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ darkMode }) => (darkMode ? "#1f2937" : "white")};
  color: ${({ darkMode }) => (darkMode ? "white" : "black")};
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const Spacer = styled.div`
  height: 70px;
`;

const Logo = styled.div`
  font-size: 22px;
  font-weight: bold;
  cursor: pointer;
  color: inherit;
`;

const NavContainer = styled.div`
  display: flex;
  align-items: center;
`;

const NavBar = styled(motion.nav)`
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileNav = styled(motion.nav)`
  position: fixed;
  top: 0;
  right: ${({ $isOpen }) => ($isOpen ? "0" : "-100%")};
  height: 100vh;
  width: 250px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: -4px 0px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: right 0.3s ease-in-out;
  z-index: 1000;
`;

const NavLink = styled(ScrollLink)`
  text-decoration: none;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 0;
  width: 100%;
  text-align: center;
  color: inherit;

  &:hover {
    color: #0070f3;
  }
`;

const MenuButton = styled.button`
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  display: none;
  position: absolute;
  right: 20px;
  z-index: 1000;
  color: inherit;

  @media (max-width: 768px) {
    display: block;
  }
`;

const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

const projects = [
  { id: "project1", image: "/project1.jpeg", date: "January 2024", title: "Project 1", description: "A modern web development project using React and Tailwind CSS." },
  { id: "project2", image: "/project2.jpeg", date: "March 2024", title: "Project 2", description: "An intuitive UI/UX design project focused on user experience." },
  { id: "project3", image: "/project3.jpeg", date: "May 2024", title: "Project 3", description: "A database management system designed for efficiency and scalability." },
  { id: "project4", image: "/project4.jpeg", date: "July 2024", title: "Project 4", description: "A full-stack application integrating backend services." }
];

function AboutMe() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [ratings, setRatings] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };


  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await web.search(query);
      setResponse(result);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResponse({ error: "Terjadi kesalahan. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ Fungsi untuk mengirim rating
  const handleRate = async (rating) => {
    try {
      if (selectedRating === rating) return; // Mencegah rating ganda dari user yang sama dalam satu sesi
      
      setSelectedRating(rating);
      await addRating(rating);
      
      await fetchRatings(); // Refresh data rating setelah menambah rating
    } catch (error) {
      console.error("🔥 Error submitting rating:", error.message);
    }
  };

  // ✅ Fungsi untuk mengambil data rating dari Firestore
  const fetchRatings = async () => {
    try {
      const { ratings, averageRating, totalVotes } = await getRatings();

      setRatings(ratings);
      setAverageRating(averageRating);
      setTotalVotes(totalVotes);
    } catch (error) {
      console.error("🔥 Error fetching ratings:", error.message);
    }
  };

  // ✅ Ambil data rating saat komponen pertama kali dirender
  useEffect(() => {
    fetchRatings();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    // Pastikan hanya berjalan di client
    if (typeof window !== "undefined") {
      const storedTheme = window.localStorage.getItem("theme");
      setDarkMode(storedTheme === "dark");
    }
  }, []);


  // Mencegah render sebelum state diinisialisasi (menghindari hydration error)
  if (darkMode === null) return null;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments();
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    fetchComments();
  }, []);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      alert("Nama dan komentar tidak boleh kosong!");
      return;
    }
    try {
      await addComment(name, comment);
      const updatedComments = await getComments();
      setComments(updatedComments);
      setName("");
      setComment("");
    } catch (error) {
      console.error("Error saat menambahkan komentar:", error);
      alert("Terjadi kesalahan saat menambahkan komentar");
    }
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDarkMode(window.localStorage.getItem("theme") === "dark");
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const toggleTheme = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("theme", newMode ? "dark" : "light");
      }
      return newMode;
    });
  };

  if (darkMode === null) return null;

  return (
    <div className={`flex flex-col min-h-screen transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
    <header
      className={`fixed top-0 left-0 w-full z-50 p-4 border-b transition-all duration-300 ${
        darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold">My Portfolio</div>
        <nav className="hidden md:flex space-x-6">
          {["about", "skills", "portfolio", "services", "contact"].map((item) => (
            <NavLink
              key={item}
              to={item}
              smooth={true}
              duration={600}
              className={darkMode ? "text-white" : "text-black"}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </NavLink>
          ))}
        </nav>

        <button onClick={toggleMenu} className="md:hidden p-2 text-lg">
          {menuOpen ? (
            <FaTimes className={darkMode ? "text-white" : "text-black"} />
          ) : (
            <FaBars className={darkMode ? "text-white" : "text-black"} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`md:hidden flex flex-col items-center space-y-4 p-4 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          {["about", "skills", "portfolio", "services", "contact"].map((item) => (
            <NavLink
              key={item}
              to={item}
              smooth={true}
              duration={600}
              onClick={toggleMenu}
              className="block py-2"
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </NavLink>
          ))}
        </div>
      )}
    </header>
    
    {/* Tambahkan padding-top untuk menghindari header menutupi konten */}
    <main className="flex flex-col pt-20">

    <section id="about" className={`flex flex-col md:flex-row items-center justify-center min-h-screen pt-20 pb-10 transition-all duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
  {/* Bagian Kiri */}
  <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 md:px-16 py-6 md:py-0">
    {/* Profile Image */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative z-10"
    >
      <Image
        src="/aziz.jpeg"
        alt="Profile Picture"
        width={380}
        height={380}
        className="w-32 h-32 md:w-72 md:h-72 rounded-full shadow-lg object-cover border-4 border-white opacity-90 transition-transform duration-300 hover:scale-110"
      />
    </motion.div>

    {/* Nama & Universitas */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="text-center mt-3 relative z-10"
    >
      <h2 className="text-base md:text-xl font-bold">MOH. ABDUL AZIZ</h2>
      <p className="text-xs md:text-sm">Universitas Ma'soem</p>
    </motion.div>
  </div>

  {/* Bagian Kanan */}
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8 }}
    className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 md:px-16 py-6 md:py-0"
  >
    <h1 className="text-xl md:text-4xl font-bold mb-3 text-center">About Me</h1>
    <p className="text-sm md:text-lg leading-relaxed text-center max-w-lg">
      Hi, I'm a passionate <span className="font-semibold text-yellow-500">UI/UX Designer & Frontend Developer</span> who specializes in creating visually appealing and user-friendly designs. 
      Currently, I am a student at <span className="font-semibold text-blue-500">Universitas Ma'soem</span>, where I am learning <span className="font-semibold text-yellow-500">Frontend Development</span> and <span className="font-semibold text-blue-500">Data Science</span>.
    </p>
    <p className="text-sm md:text-lg leading-relaxed mt-3 text-center max-w-lg">
      I love building clean, modern interfaces that enhance user experiences. I have experience working with technologies like <span className="font-semibold text-blue-500">React.js, Tailwind CSS, and Next.js</span>. 
      I'm also passionate about data analysis and love finding insights from data using tools like Python and SQL.
    </p>

    {/* Tombol LinkedIn & Portfolio */}
    <div className="mt-4 flex flex-col md:flex-row gap-4">
      <motion.div whileHover={{ scale: 1.1 }}>
        <a
          href="www.linkedin.com/in/moh-abdul-aziz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
          <FaLinkedin size={20} />
          LinkedIn
        </a>
      </motion.div>
      <motion.div whileHover={{ scale: 1.1 }}>
        <a
          href="#portfolio"
          className="flex items-center gap-2 px-5 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
        >
          <FaExternalLinkAlt size={18} />
          Portfolio
        </a>
      </motion.div>
    </div>
  </motion.div>
</section>


{/* Skills Section */}
<section id="skills" className={`relative flex items-center justify-center px-6 md:px-16 py-24 overflow-hidden transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    transition={{ duration: 1 }} 
    className="flex flex-col md:flex-row items-center gap-12 w-full max-w-6xl"
  >
    {/* Keterampilan Kiri (Data Science & Copywriting) */}
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
      className="w-full md:w-1/2 text-center md:text-left"
    >
      <h2 className="text-4xl md:text-5xl font-bold text-blue-800 mb-12">My Skills</h2>
      
      {/* Skill Data Science */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8"
      >
        <Image
          src="/datascience.jpeg"
          alt="Data Science"
          width={120}
          height={120}
          className="w-32 h-32 md:w-40 md:h-40 rounded-lg shadow-xl"
        />
        <div>
          <h3 className="text-xl md:text-2xl font-semibold">Data Science</h3>
          <p className="text-gray-600 text-sm md:text-base">Analyzing and interpreting complex data to drive insights and decisions.</p>
        </div>
      </motion.div>
      
      {/* Skill Copywriting */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8"
      >
        <Image
          src="/copywriter.png"
          alt="Copywriting"
          width={120}
          height={120}
          className="w-32 h-32 md:w-40 md:h-40 rounded-lg shadow-xl"
        />
        <div>
          <h3 className="text-xl md:text-2xl font-semibold">Copywriting</h3>
          <p className="text-gray-600 text-sm md:text-base">Crafting compelling and persuasive content for various media platforms.</p>
        </div>
      </motion.div>
    </motion.div>
    
    {/* Keterampilan Kanan (Design & Frontend Development) */}
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
      className="w-full md:w-1/2 text-center md:text-left mt-12 md:mt-0"
    >
      {/* Skill Design */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8"
      >
        <Image
          src="/ui.jpeg"
          alt="Design"
          width={140}
          height={140}
          className="w-36 h-36 md:w-44 md:h-44 rounded-lg shadow-xl"
        />
        <div>
          <h3 className="text-xl md:text-2xl font-semibold">Design</h3>
          <p className="text-gray-600 text-sm md:text-base">Creating visually stunning and user-friendly interfaces with modern aesthetics.</p>
        </div>
      </motion.div>
      
      {/* Skill Frontend Development */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-6"
      >
        <Image
          src="/visual.jpeg"
          alt="Frontend Development"
          width={140}
          height={140}
          className="w-36 h-36 md:w-44 md:h-44 rounded-lg shadow-xl"
        />
        <div>
          <h3 className="text-xl md:text-2xl font-semibold">Frontend Development</h3>
          <p className="text-gray-600 text-sm md:text-base">Building responsive and interactive web applications with modern frameworks.</p>
        </div>
      </motion.div>
    </motion.div>
  </motion.div>
</section>

<section
      id="portfolio"
      className={`py-20 flex items-center justify-center text-center relative overflow-hidden transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full max-w-6xl mx-auto flex flex-col items-center px-4 sm:px-8"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-6 sm:mb-8 pt-6 sm:pt-8">Portfolio</h2>
        <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12">
          Here are some of my recent projects:
        </p>

        {/* Container untuk scroll */}
        <div className="relative w-full flex items-center">
          {/* Tombol Navigasi Kiri */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 z-10 bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 transition -translate-x-1/2"
          >
            ❮
          </button>

          <div
            ref={scrollContainerRef}
            className="flex items-center w-full space-x-6 sm:space-x-12 px-4 sm:px-8 scroll-smooth overflow-hidden"
          >
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative flex flex-col items-center text-center min-w-[260px] sm:min-w-[300px] cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => setSelectedProject(project)}
              >
                <Image
                  src={project.image}
                  width={280}
                  height={180}
                  alt={project.title}
                  className="rounded-lg shadow-lg"
                />
                <p className="text-gray-500 text-xs sm:text-sm mt-3">{project.date}</p>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{project.title}</h3>
                <p className="text-gray-600 text-sm sm:text-base">{project.description}</p>
              </div>
            ))}
          </div>

          {/* Tombol Navigasi Kanan */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 z-10 bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 transition translate-x-1/2"
          >
            ❯
          </button>
        </div>
      </motion.div>
    </section>

    <section
      id="services"
      className={`py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      } mb-20 sm:mb-24`}
    >
      <div className="mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-800 dark:text-blue-400 mb-6 sm:mb-8">
          Our Services
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl sm:max-w-2xl mx-auto">
          Elevate your digital presence with our top-notch services. We provide cutting-edge solutions to help your business grow and thrive.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-6 sm:mt-8 w-full max-w-4xl">
        {/* Card Component */}
        {[ 
          {
            icon: <FaCode className="text-blue-600 dark:text-blue-400 text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto" />, 
            image: "/ecommerce.jpeg", 
            title: "Web Development", 
            description: "We craft high-performance websites tailored to your business needs, ensuring seamless user experience."
          },
          {
            icon: <FaProjectDiagram className="text-blue-600 dark:text-blue-400 text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto" />, 
            image: "/ui.jpeg", 
            title: "UI/UX Design", 
            description: "Our intuitive and visually stunning designs guarantee an exceptional user journey and engagement."
          },
          {
            icon: <FaMobileAlt className="text-blue-600 dark:text-blue-400 text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto" />, 
            image: "/dashboard.jpeg", 
            title: "Mobile App Development", 
            description: "We develop scalable and feature-rich mobile applications that cater to your business goals and user needs."
          }
        ].map((service, index) => (
          <div
            key={index}
            className={`p-5 sm:p-6 rounded-lg shadow-md transform hover:scale-105 hover:shadow-lg transition-all duration-500 ease-in-out ${
              darkMode ? "bg-gray-800 text-white shadow-gray-700" : "bg-gray-100 text-black"
            }`}
          >
            <img src={service.image} alt={service.title} className="w-full h-28 sm:h-32 object-cover rounded-md mb-3 sm:mb-4" />
            {service.icon}
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </section>

    <motion.section 
      id="contact" 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} animate-fadeIn`}> 
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-4 sm:px-8">
        <motion.h2 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-blue-500 dark:text-blue-400 mb-6 sm:mb-8"
        >
          Contact Me
        </motion.h2>
        
        <p className="text-base sm:text-lg mb-8 sm:mb-12 text-gray-600 dark:text-gray-300">
          Feel free to reach out through any of the platforms below:
        </p>

        <div className="w-full flex flex-col sm:flex-row sm:justify-between items-center text-lg sm:text-xl space-y-6 sm:space-y-0 sm:space-x-10">
          {/* Nomor HP */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-4 transition-transform duration-300"
          >
            <FaPhone className="text-blue-500 dark:text-blue-400 text-2xl" />
            <a href="tel:+6281214006515" className="text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 transition">
              +62 812-1400-6515
            </a>
          </motion.div>

          {/* Email */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-4 transition-transform duration-300"
          >
            <FaEnvelope className="text-red-500 dark:text-red-400 text-2xl" />
            <a href="mailto:abdulaziz27042004@email.com" className="text-gray-800 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400 transition">
              abdulaziz27042004@email.com
            </a>
          </motion.div>
        </div>

        {/* Media Sosial */}
        <div className="flex space-x-6 sm:space-x-8 mt-10">
          {[FaFacebook, FaInstagram, FaLinkedin, FaTwitter].map((Icon, index) => (
            <motion.a 
              key={index} 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              href="#"
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-3xl transition-transform duration-300"
              style={{ color: ["#1877f2", "#e1306c", "#0077b5", "#1da1f2"][index] }}
            >
              <Icon />
            </motion.a>
          ))}
        </div>
      </div>
    </motion.section>
    
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} animate-fadeIn`}> 
      <div className="w-4/5 sm:w-2/3 flex flex-col items-center bg-transparent p-6 sm:p-8">
        <motion.h2 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3 sm:mb-4"
        >
          Get in Touch
        </motion.h2>
        
        <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
          Let's create something amazing together!
        </p>

        {/* Form Komentar */}
        <motion.form 
          onSubmit={handleCommentSubmit}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`w-full max-w-xs sm:max-w-md p-5 sm:p-6 rounded-lg shadow-md transition-all duration-300 border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
        >
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Leave a Comment</h3>

          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full p-2 sm:p-3 mb-3 sm:mb-4 border rounded-md bg-transparent ${darkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-black'}`}
            required
          />

          <textarea
            placeholder="Your Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`w-full p-2 sm:p-3 mb-3 sm:mb-4 border rounded-md bg-transparent ${darkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-black'}`}
            required
          ></textarea>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-blue-600 text-white p-2 sm:p-3 rounded-md hover:bg-blue-700 transition-all"
          >
            Submit
          </motion.button>
        </motion.form>

        {/* Daftar Komentar */}
        <div className="mt-5 sm:mt-6 w-full flex flex-col items-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Comments</h3>
          
          <motion.ul 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-full p-4 sm:p-5 rounded-lg shadow-md transition-all duration-300 text-left border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
          >
            {comments.map((comment, index) => (
              <motion.li 
                key={index} 
                whileHover={{ scale: 1.02 }}
                className={`w-full p-4 sm:p-5 rounded-lg shadow-md transition-all duration-300 text-left border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}
              >
                <strong className="text-gray-900 dark:text-white">{comment.name}:</strong> {comment.comment}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </motion.section>

    <section className={`py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} animate-fadeIn`}> 
  <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3 sm:mb-4 animate-slideUp">
    Rate In Website
  </h2>

  {/* Bintang Rating */}
  <div className="flex justify-center gap-2 mb-4 animate-scaleIn">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => handleRate(star)}
        className={`text-3xl transition-all duration-300 transform ${
          star <= selectedRating 
            ? "text-yellow-400 scale-125 drop-shadow-lg" 
            : "text-gray-400 dark:text-gray-300 hover:text-yellow-300 dark:hover:text-yellow-400 hover:scale-110"
        }`}
      >
        ★
      </button>
    ))}
  </div>

  {/* Teks Rating */}
  <p className="text-lg font-semibold text-gray-800 dark:text-white transition-all animate-fadeIn">
    Rating <span className="text-blue-600 dark:text-blue-400">{averageRating.toFixed(1)}</span> 
    ({totalVotes} votes)
  </p>
</section>

{/* AI Chatbot Section */}
<section className={`py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} animate-fadeIn`}> 
  <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3 sm:mb-4 animate-slideUp flex items-center">
    <FaRobot className="mr-2 text-blue-500 dark:text-white animate-pulse" /> Fitur AI - Chatbot
  </h2>
  <p className="text-sm text-gray-600 dark:text-gray-300 animate-fadeIn">Masukkan pertanyaan terkait berita, jurnal, atau artikel terbaru.</p>

  {/* Input dan Tombol Cari */}
  <div className="mt-3 flex flex-col sm:flex-row gap-3 animate-slideUp">
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Tanyakan sesuatu..."
      className="border p-3 flex-grow rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200 bg-white dark:bg-gray-800 text-black dark:text-white"
    />
    <button
      onClick={handleSearch}
      className="bg-blue-500 text-white px-5 py-3 rounded-md hover:bg-blue-600 active:scale-95 transition-all duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
    >
      Cari 🔍
    </button>
  </div>

  {/* Loading State */}
  {loading && (
    <p className="text-blue-500 dark:text-blue-400 mt-3 animate-pulse">Mencari...</p>
  )}

  {/* Hasil Pencarian */}
  {response && response.result && Array.isArray(response.result) ? (
    <ul className="mt-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 transition-all duration-300 animate-fadeIn">
      {response.result.map((item, index) => (
        <li key={index} className="mb-3">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200"
          >
            {item.title}
          </a>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{item.snippet}</p>
        </li>
      ))}
    </ul>
  ) : (
    response?.error && (
      <p className="mt-3 p-3 border rounded-md bg-red-50 dark:bg-red-900 text-red-500 dark:text-white">
        {response.error}
      </p>
    )
  )}
</section>

      </main>
          <footer
          className={`w-full text-center p-5 border-t transition-all duration-300 ${
            darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"
          }`}
        >
          <p>&copy; {new Date().getFullYear()} My Portfolio. All Rights Reserved.</p>
        </footer>
      
      {/* Tombol Toggle Dark Mode */}
      <button
      onClick={toggleTheme}
      className="fixed bottom-4 left-4 p-3 rounded-full shadow-md text-lg font-semibold transition-all duration-300 ease-in-out z-50"
      style={{
        backgroundColor: darkMode ? "#4A5568" : "#E2E8F0",
        color: darkMode ? "white" : "black",
      }}
    >
      {darkMode ? <Sun size={24} /> : <Moon size={24} />}
    </button>

      {/* Smooth Scroll Behavior */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
          
          {selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative text-black">
            <button className="absolute top-2 right-2 text-gray-600" onClick={() => setSelectedProject(null)}>&times;</button>
            <Image src={selectedProject.image} width={400} height={300} alt={selectedProject.title} className="rounded-lg" />
            <h3 className="text-2xl font-semibold mt-4">{selectedProject.title}</h3>
            <p className="text-sm">{selectedProject.date}</p>
            <p className="mt-2">{selectedProject.description}</p>
            <p className="mt-4">This project involved extensive development and testing to ensure a seamless user experience. Key technologies and methodologies used include:</p>
            <ul className="list-disc list-inside mt-2">
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default AboutMe;
