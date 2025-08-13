import { motion } from "framer-motion";

// Fade-in only animation (no movement)
const fadeInOnly = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: {
      delay: i * 0.3,
      duration: 1,
      ease: "easeInOut",
    },
  }),
};

const FeatureSection = ({ features }) => {
  return (
    <section className="pt-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInOnly}
          custom={0}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif transition-transform duration-300">
            Why Choose LearnHub?
          </h2>
          <p className="text-xl text-gray-600 hover:text-gray-700 transition-colors duration-300">
            Everything you need to advance your skills and career
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                custom={index + 1}
                variants={fadeInOnly}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg p-8 text-center 
                  hover:shadow-2xl hover:scale-[1.02] transition duration-300"
              >
                <div className="flex items-center justify-center w-16 h-16 mx-auto 
                  bg-blue-100 text-blue-600 rounded-full mb-4 
                  hover:rotate-6 transition-transform duration-300"
                >
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-base">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
