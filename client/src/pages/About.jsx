import React from 'react';

const About = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    {/* Hero */}
    <section className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">About EduMe</h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
        EduMe is a modern learning platform designed to connect ambitious learners with expert instructors, 
        delivering engaging, practical, and outcomes‑driven education.
      </p>
    </section>

    {/* Mission */}
    <section className="bg-white rounded-xl shadow p-6 md:p-8 mb-10">
      <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
      <p className="mt-3 text-gray-700 leading-relaxed">
        We believe great education should be accessible, interactive, and measurable. EduMe brings together
        high‑quality content, smart recommendations, and community discussion to help learners master skills
        faster while giving instructors the tools to create and scale impactful courses.
      </p>
    </section>

    {/* Highlights */}
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900">Quality Courses</h3>
        <p className="mt-2 text-gray-600">Structured curricula, clear outcomes, and real projects to build job‑ready skills.</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900">Personalized Learning</h3>
        <p className="mt-2 text-gray-600">Smart recommendations to match your interests and skill level.</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900">Community & Feedback</h3>
        <p className="mt-2 text-gray-600">Built‑in Q&A and reviews for timely support and continuous improvement.</p>
      </div>
    </section>

    {/* Stats */}
    <section className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-6 md:p-8 mb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-3xl font-extrabold text-primary-700">99%</div>
          <div className="mt-1 text-sm text-gray-600">Learner Satisfaction</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-primary-700">10k+</div>
          <div className="mt-1 text-sm text-gray-600">Active Learners</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-primary-700">500+</div>
          <div className="mt-1 text-sm text-gray-600">Expert Lessons</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-primary-700">4.8/5</div>
          <div className="mt-1 text-sm text-gray-600">Average Course Rating</div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900">Learner‑First</h3>
        <p className="mt-2 text-gray-600">We optimize for clarity, momentum, and measurable outcomes.</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900">Excellence</h3>
        <p className="mt-2 text-gray-600">High standards across content, UX, and support—no compromises.</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900">Community</h3>
        <p className="mt-2 text-gray-600">Meaningful collaboration between students and instructors.</p>
      </div>
    </section>

    {/* Contact */}
    <section className="bg-white rounded-xl shadow p-6 md:p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Get in touch</h2>
      <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
        Have feedback or partnership ideas? We’d love to hear from you.
      </p>
      <div className="mt-5">
        <a
          href="mailto:kevalc1316@gmail.com"
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          Email us at kevalc1316@gmail.com
        </a>
      </div>
    </section>
  </div>
);

export default About;
