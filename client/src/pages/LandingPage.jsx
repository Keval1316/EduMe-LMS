import Navbar from "../components/Navbar";

const LandingPage = () => {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Welcome to EduMe LMS</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Your gateway to smarter learning</p>
          <a href="/signup">
            <button className="mt-6 px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800">
              Get Started
            </button>
          </a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">About Us</h2>
          <p className="text-gray-600 dark:text-gray-300">[Placeholder for About section]</p>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Our Services</h2>
          <p className="text-gray-600 dark:text-gray-300">[Placeholder for Services section]</p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Contact Us</h2>
          <p className="text-gray-600 dark:text-gray-300">[Placeholder for Contact section]</p>
        </div>
      </section>
    </>
  );
};

export default LandingPage;
