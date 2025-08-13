import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: {
      delay: i * 0.2,
      duration: 0.8,
      ease: "easeOut",
    },
  }),
};

const services = [
  {
    title: "For Students",
    features: [
      "Access to 1000+ courses across various fields",
      "Interactive quizzes and assignments",
      "Progress tracking and analytics",
      "Verified certificates upon completion",
      "Community discussions and support",
    ],
  },
  {
    title: "For Instructors",
    features: [
      "Easy-to-use course creation tools",
      "Comprehensive analytics dashboard",
      "Student management system",
      "Revenue tracking and reporting",
      "Built-in communication tools",
    ],
  },
];

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          custom={0}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif tracking-tight">
            Our Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tailored features for both learners and educators to thrive.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {services.map((service, index) => (
            <motion.div
              key={index}
              custom={index + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <h3 className="text-2xl font-semibold text-gray-800 mb-5">
                {service.title}
              </h3>
              <ul className="space-y-3">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-gray-600">
                    <div className="w-2.5 h-2.5 mt-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
