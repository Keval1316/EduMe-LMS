import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [stars, setStars] = useState([]);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  const rotatingWords = ["AI", "Design", "Marketing", "Data", "Coding"];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tempStars = [];
    for (let i = 0; i < 20; i++) {
      tempStars.push({
        id: i,
        size: Math.random() * 10 + 2,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: Math.random() * 5 + 5,
      });
    }
    setStars(tempStars);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-gray-800">
      {/* Falling stars */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full opacity-70 animate-fall-star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.left}%`,
              top: `-10%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-32 text-center">
        {/* Animated Heading */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-[cursive] font-bold mb-6 leading-tight transition-transform duration-300"
        >
          Master the Future with{" "}
          <span className="inline-flex items-center justify-center text-blue-700 relative w-28 h-12 align-baseline">

            <AnimatePresence mode="wait">
              <motion.span
                key={rotatingWords[activeWordIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute left-0 right-0"
              >
                {rotatingWords[activeWordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>


        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          whileHover={{ color: "#4B5563" }}
          className="text-lg md:text-2xl mb-10 text-gray-700 transition-colors duration-300"
        >
          Join thousands of learners advancing their careers with our expert-led courses.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div  transition={{ type: "spring", stiffness: 300 }}>
            <Link to="/register">
              <button className="px-6 py-3 text-lg font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-300">
                Get Started Free
                <ArrowRight size={20} className="inline ml-2" />
              </button>
            </Link>
          </motion.div>

          <motion.div transition={{ type: "spring", stiffness: 300 }}>
            <Link to="/courses">
              <button className="px-6 py-3 text-lg font-semibold rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition duration-300">
                Browse Courses
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
