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
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Header from "../components/header";
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

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    setDarkMode(window.localStorage.getItem("theme") === "dark");
  }, []);

  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
  };

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

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
       <HeaderWrapper darkMode={darkMode}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Logo>My Portfolio</Logo>
        <NavContainer>
          <NavBar>
            {["about", "skills", "portfolio", "services", "contact"].map((item) => (
              <NavLink key={item} to={item} smooth={true} duration={600}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </NavLink>
            ))}
          </NavBar>
          <MenuButton onClick={toggleMenu} aria-label="Toggle menu">
            {menuOpen ? <FaTimes /> : <FaBars />}
          </MenuButton>
        </NavContainer>
        <MobileNav ref={menuRef} $isOpen={menuOpen}>
          {["about", "skills", "portfolio", "services", "contact"].map((item) => (
            <NavLink key={item} to={item} smooth={true} duration={600} onClick={toggleMenu}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </NavLink>
          ))}
        </MobileNav>
      </HeaderWrapper>
      
      <main className="flex flex-col">

      <section id="about" className={`flex flex-col md:flex-row h-auto md:h-screen transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
  {/* Bagian Kiri */}
  <div
    className="w-full md:w-1/2 h-auto md:h-full flex flex-col items-center justify-center relative py-8 md:py-0"
    style={{
      background: darkMode
        ? "linear-gradient(to right, rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.6))"
        : "linear-gradient(to right, rgba(31, 41, 55, 0.9), rgba(31, 41, 55, 0.6))",
    }}
  >
    {/* Background Blur */}
    <div
      className="absolute inset-0 bg-cover bg-center blur-md opacity-40"
      style={{ backgroundImage: "url('/aziz.jpeg')" }}
    />

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
        className="w-40 h-40 md:w-72 md:h-72 rounded-full shadow-lg object-cover border-4 border-white opacity-90 transition-transform duration-300 hover:scale-110"
      />
    </motion.div>

    {/* Nama & Universitas */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="text-center mt-4"
    >
      <h2 className="text-lg md:text-xl font-bold">Aziz Maulana</h2>
      <p className="text-xs md:text-sm">Universitas Ma'soem</p>
    </motion.div>
  </div>

  {/* Bagian Kanan */}
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8 }}
    className={`w-full md:w-1/2 h-auto md:h-full flex flex-col justify-center px-6 md:px-16 py-8 md:py-0 transition-all duration-300 ${darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`}
  >
    <h1 className="text-2xl md:text-4xl font-bold mb-4">About Me</h1>
    <p className="text-sm md:text-lg leading-relaxed">
      Hi, I'm a passionate <span className="font-semibold text-yellow-500">UI/UX Designer & Frontend Developer</span> who specializes in creating visually appealing and user-friendly designs. 
      Currently, I am a student at <span className="font-semibold text-blue-500">Universitas Ma'soem</span>, where I am learning <span className="font-semibold text-yellow-500">Frontend Development</span> and <span className="font-semibold text-blue-500">Data Science</span>.
    </p>
    <p className="text-sm md:text-lg leading-relaxed mt-3">
      I love building clean, modern interfaces that enhance user experiences. I have experience working with technologies like <span className="font-semibold text-blue-500">React.js, Tailwind CSS, and Next.js</span>. 
      I'm also passionate about data analysis and love finding insights from data using tools like Python and SQL.
    </p>

    {/* Tombol LinkedIn & Portfolio */}
    <div className="mt-6 flex flex-col md:flex-row gap-4">
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
<section id="skills" className={`relative flex min-h-screen items-center justify-center px-6 md:px-16 overflow-hidden transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
<motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1 }} 
        className="flex flex-col md:flex-row items-center gap-10 w-full max-w-6xl"
      >
        {/* Keterampilan Kiri (Data Science & Copywriting) */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-1/2 text-center md:text-left"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-blue-800 mb-6 md:mb-8">My Skills</h2>

          {/* Skill Data Science */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-8"
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
            className="flex flex-col md:flex-row items-center gap-4 md:gap-6"
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

        {/* Keterampilan Kanan (Design) */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-1/2 text-center md:text-left mt-10 md:mt-0"
        >
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center gap-4 md:gap-6"
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
        </motion.div>
      </motion.div>
    </section>

    <section
  id="portfolio"
  className={`py-20 flex min-h-screen items-center justify-center text-center relative overflow-hidden transition-all duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}
>
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="w-full max-w-6xl mx-auto flex flex-col items-center px-4 sm:px-8"
  >
    <h2 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-6 sm:mb-8">Portfolio</h2>
    <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12">Here are some of my recent projects:</p>

    {/* Container untuk scroll horizontal */}
    <div className="relative w-full">
      {/* Tombol Navigasi Kiri */}
      <button
        onClick={() => {
          const container = document.getElementById("scrollContainer");
          container.scrollLeft -= 300;
        }}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 transition"
      >
        ❮
      </button>

      <div
        id="scrollContainer"
        className="flex items-center w-full overflow-x-scroll space-x-6 sm:space-x-12 px-4 sm:px-8 scrollbar-hide scroll-smooth"
      >
        {/* Project Cards */}
        {projects.map((project) => (
          <div
            key={project.id}
            className="relative flex flex-col items-center text-center min-w-[260px] sm:min-w-[300px] cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => setSelectedProject(project)}
          >
            <Image src={project.image} width={280} height={180} alt={project.title} className="rounded-lg shadow-lg" />
            <p className="text-gray-500 text-xs sm:text-sm mt-3">{project.date}</p>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{project.title}</h3>
            <p className="text-gray-600 text-sm sm:text-base">{project.description}</p>
          </div>
        ))}
      </div>

      {/* Tombol Navigasi Kanan */}
      <button
        onClick={() => {
          const container = document.getElementById("scrollContainer");
          container.scrollLeft += 300;
        }}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 transition"
      >
        ❯
      </button>
    </div>
  </motion.div>
</section>

<section 
  id="services" 
  className={`py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center min-h-screen transition-all duration-300 ${
    darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
  }`}
> 
  <h2 className="text-3xl sm:text-4xl font-bold text-blue-800 dark:text-blue-400 mb-4 sm:mb-6">
    Our Services
  </h2>
  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl sm:max-w-2xl">
    Elevate your digital presence with our top-notch services. We provide cutting-edge solutions to help your business grow and thrive.
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-10 w-full max-w-5xl">
    {/* Card 1 */}
    <div className={`p-5 sm:p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
      darkMode ? "bg-gray-800 text-white shadow-gray-700" : "bg-gray-100 text-black"
    }`}>
      <img src="/ecommerce.jpeg" alt="Web Development" className="w-full h-32 sm:h-40 object-cover rounded-md mb-3 sm:mb-4" />
      <FaCode className="text-blue-600 dark:text-blue-400 text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto" />
      <h3 className="text-xl sm:text-2xl font-semibold mb-2">Web Development</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
        We craft high-performance websites tailored to your business needs, ensuring seamless user experience.
      </p>
    </div>

    {/* Card 2 */}
    <div className={`p-5 sm:p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
      darkMode ? "bg-gray-800 text-white shadow-gray-700" : "bg-gray-100 text-black"
    }`}>
      <img src="/ui.jpeg" alt="UI/UX Design" className="w-full h-32 sm:h-40 object-cover rounded-md mb-3 sm:mb-4" />
      <FaProjectDiagram className="text-blue-600 dark:text-blue-400 text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto" />
      <h3 className="text-xl sm:text-2xl font-semibold mb-2">UI/UX Design</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
        Our intuitive and visually stunning designs guarantee an exceptional user journey and engagement.
      </p>
    </div>

    {/* Card 3 */}
    <div className={`p-5 sm:p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
      darkMode ? "bg-gray-800 text-white shadow-gray-700" : "bg-gray-100 text-black"
    }`}>
      <img src="/dashboard.jpeg" alt="Mobile App Development" className="w-full h-32 sm:h-40 object-cover rounded-md mb-3 sm:mb-4" />
      <FaMobileAlt className="text-blue-600 dark:text-blue-400 text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto" />
      <h3 className="text-xl sm:text-2xl font-semibold mb-2">Mobile App Development</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
        We develop scalable and feature-rich mobile applications that cater to your business goals and user needs.
      </p>
    </div>
  </div>
</section>

<section 
  id="contact" 
  className={`py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center transition-all duration-300 ${
    darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
  }`}
> 
  <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-4 sm:px-8">
    <h2 className="text-3xl sm:text-4xl font-bold text-blue-500 mb-6 sm:mb-8">Contact Me</h2>
    <p className={`text-base sm:text-lg mb-8 sm:mb-12 ${
      darkMode ? "text-gray-300" : "text-gray-600"
    }`}>
      Feel free to reach out through any of the platforms below:
    </p>

    <div className="w-full flex flex-col sm:flex-row sm:justify-between items-center text-lg sm:text-xl space-y-6 sm:space-y-0 sm:space-x-10">
      {/* Nomor HP */}
      <div className="flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
        <FaPhone className="text-blue-500 text-2xl" />
        <a href="tel:+6281214006515" className={`transition ${
          darkMode ? "text-white hover:text-blue-400" : "text-gray-800 hover:text-blue-500"
        }`}>
          +62 812-1400-6515
        </a>
      </div>

      {/* Email */}
      <div className="flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
        <FaEnvelope className="text-red-500 text-2xl" />
        <a href="mailto:abdulaziz27042004@email.com" className={`transition ${
          darkMode ? "text-white hover:text-red-400" : "text-gray-800 hover:text-red-500"
        }`}>
          abdulaziz27042004@email.com
        </a>
      </div>
    </div>

    {/* Media Sosial */}
    <div className="flex space-x-6 sm:space-x-8 mt-10">
      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 text-3xl hover:scale-110 transition-transform duration-300">
        <FaFacebook />
      </a>
      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-pink-600 text-3xl hover:scale-110 transition-transform duration-300">
        <FaInstagram />
      </a>
      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-3xl hover:scale-110 transition-transform duration-300">
        <FaLinkedin />
      </a>
      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-3xl hover:scale-110 transition-transform duration-300">
        <FaTwitter />
      </a>
    </div>
  </div>
</section>

<section
  className={`py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center min-h-screen gap-6 transition-all duration-300 ${
    darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
  }`}
>
  <div className="w-4/5 sm:w-2/3 flex flex-col items-center bg-transparent p-6 sm:p-8">
    <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3 sm:mb-4">
      Get in Touch
    </h2>
    <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
      Let's create something amazing together!
    </p>

    {/* Form Komentar */}
    <form
      onSubmit={handleCommentSubmit}
      className={`w-full max-w-xs sm:max-w-md p-5 sm:p-6 rounded-lg shadow-md transition-all duration-300 ${
        darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white border border-gray-300"
      }`}
    >
      <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Leave a Comment</h3>

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`w-full p-2 sm:p-3 mb-3 sm:mb-4 border rounded-md bg-transparent ${
          darkMode ? "border-gray-500 text-white" : "border-gray-300 text-black"
        }`}
        required
      />

      <textarea
        placeholder="Your Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={`w-full p-2 sm:p-3 mb-3 sm:mb-4 border rounded-md bg-transparent ${
          darkMode ? "border-gray-500 text-white" : "border-gray-300 text-black"
        }`}
        required
      ></textarea>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 sm:p-3 rounded-md hover:bg-blue-700 transition-all"
      >
        Submit
      </button>
    </form>

{/* Daftar Komentar */}
<div className="mt-5 sm:mt-6 w-full flex flex-col items-center">
  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Comments</h3>
  
  <ul className={`w-full p-4 sm:p-5 rounded-lg shadow-md transition-all duration-300 text-left ${
        darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white border border-gray-300"
      }`}>
    {comments.map((comment, index) => (
      <li key={index} className={`w-full p-4 sm:p-5 rounded-lg shadow-md transition-all duration-300 text-left ${
        darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white border border-gray-300"
      }`}>
        <strong className="text-gray-900 dark:text-white-300">{comment.name}:</strong> {comment.comment}
      </li>
    ))}
  </ul>
</div>
  </div>
</section>

<section className={`py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-300 ${
  darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
}`}>
<h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3 sm:mb-4">
  Rate In Website
    </h2>

{/* Bintang Rating */}
<div className="flex justify-center gap-2 mb-4">
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
<p className="text-lg font-semibold text-gray-800 dark:text-white-800 transition-all">
Rating <span className="text-blue-600 dark:text-white-400">{averageRating.toFixed(1)}</span> 
({totalVotes} votes)
</p>
</section>

{/* AI Chatbot Section */}
<section className={`py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-300 ${
  darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
}`}>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-3 sm:mb-4">
      <FaRobot className="mr-2 text-blue-500 dark:text-white-500 animate-pulse" /> Fitur AI - Chatbot
    </h2>
<p className="text-sm text-gray-600 dark:text-white-300">
  Masukkan pertanyaan terkait berita, jurnal, atau artikel terbaru.
</p>

{/* Input dan Tombol Cari */}
<div className="mt-3 flex flex-col sm:flex-row gap-3">
  <input
    type="text"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Tanyakan sesuatu..."
    className="border p-3 flex-grow rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
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
  <ul className="mt-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700 transition-all duration-300">
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
        <p className="text-gray-600 dark:text-white-300 text-sm">{item.snippet}</p>
      </li>
    ))}
  </ul>
) : (
  response?.error && (
    <p className="mt-3 p-3 border rounded-md bg-red-50 text-red-500 dark:bg-red-900 dark:text-white dark:border-red-700">
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
        className="fixed bottom-4 left-4 px-4 py-2 rounded-lg shadow-md text-lg font-semibold transition-all duration-300 ease-in-out z-50"
        style={{ backgroundColor: darkMode ? "#4A5568" : "#E2E8F0", color: darkMode ? "white" : "black" }}
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
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