import React, { useState } from "react";
import { FaNewspaper, FaCalendar, FaClock, FaUser, FaSearch, FaExternalLinkAlt, FaBookmark, FaHeart, FaShare, FaGlobe, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

function Articles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ✅ HEALTH ARTICLES DATA
  const articles = [
    {
      id: 1,
      title: "10 Ways to Boost Your Immune System Naturally",
      excerpt: "Discover science-backed methods to strengthen your immune system through diet, exercise, and lifestyle changes.",
      category: "Wellness",
      author: "Dr. Sarah Johnson",
      date: "January 25, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800",
      link: "https://www.healthline.com/nutrition/how-to-boost-immune-health",
    },
    {
      id: 2,
      title: "Understanding Mental Health: Breaking the Stigma",
      excerpt: "A comprehensive guide to recognizing, understanding, and supporting mental health in yourself and others.",
      category: "Mental Health",
      author: "Dr. Michael Chen",
      date: "January 23, 2026",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
      link: "https://www.healthline.com/health/mental-health",
    },
    {
      id: 3,
      title: "The Complete Guide to Heart-Healthy Living",
      excerpt: "Learn about cardiovascular health, prevention strategies, and lifestyle modifications for a healthy heart.",
      category: "Cardiology",
      author: "Dr. Emily Rodriguez",
      date: "January 20, 2026",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800",
      link: "https://www.healthline.com/health/heart-disease",
    },
    {
      id: 4,
      title: "Diabetes Prevention: Essential Tips and Strategies",
      excerpt: "Evidence-based approaches to prevent and manage diabetes through diet, exercise, and medical care.",
      category: "Diabetes",
      author: "Dr. James Wilson",
      date: "January 18, 2026",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1542736667-069246bdbc6d?w=800",
      link: "https://www.healthline.com/health/diabetes",
    },
    {
      id: 5,
      title: "Nutrition 101: Building a Balanced Diet",
      excerpt: "Master the fundamentals of nutrition and learn how to create meal plans that fuel your body optimally.",
      category: "Nutrition",
      author: "Dr. Amanda Lee",
      date: "January 15, 2026",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
      link: "https://www.healthline.com/nutrition",
    },
    {
      id: 6,
      title: "Sleep Science: How to Get Better Rest",
      excerpt: "Uncover the secrets of quality sleep and its profound impact on your physical and mental health.",
      category: "Sleep",
      author: "Dr. Robert Martinez",
      date: "January 12, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1520206183501-b80df61043c2?w=800",
      link: "https://www.healthline.com/health/sleep",
    },
    {
      id: 7,
      title: "Exercise and Fitness: A Beginner's Guide",
      excerpt: "Start your fitness journey with expert advice on workouts, recovery, and building sustainable habits.",
      category: "Fitness",
      author: "Dr. Lisa Thompson",
      date: "January 10, 2026",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
      link: "https://www.healthline.com/nutrition/10-benefits-of-exercise",
    },
    {
      id: 8,
      title: "Managing Stress in Modern Life",
      excerpt: "Practical techniques and strategies to reduce stress and improve your overall quality of life.",
      category: "Mental Health",
      author: "Dr. David Kim",
      date: "January 8, 2026",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
      link: "https://www.healthline.com/health/stress",
    },
    {
      id: 9,
      title: "Women's Health: Essential Screenings and Care",
      excerpt: "A comprehensive guide to preventive care, screenings, and health priorities for women at every age.",
      category: "Women's Health",
      author: "Dr. Jennifer Brown",
      date: "January 5, 2026",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800",
      link: "https://www.healthline.com/health/womens-health",
    },
  ];

  // ✅ EXTERNAL HEALTH RESOURCES
  const externalResources = [
    {
      id: 1,
      name: "Healthline",
      description: "Evidence-based health and wellness information from medical experts",
      url: "https://www.healthline.com/",
      icon: "🏥",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      id: 2,
      name: "WebMD",
      description: "Trusted medical information, symptom checker, and health tools",
      url: "https://www.webmd.com/",
      icon: "⚕️",
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
    },
    {
      id: 3,
      name: "Mayo Clinic",
      description: "Expert health information and medical research from leading specialists",
      url: "https://www.mayoclinic.org/",
      icon: "🏨",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
    },
    {
      id: 4,
      name: "CDC Health Topics",
      description: "Official health guidelines and disease information from CDC",
      url: "https://www.cdc.gov/health-topics.html",
      icon: "🔬",
      color: "from-red-500 to-red-600",
      bgColor: "from-red-50 to-red-100",
    },
    {
      id: 5,
      name: "MedlinePlus",
      description: "Reliable health information from the National Library of Medicine",
      url: "https://medlineplus.gov/",
      icon: "📚",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "from-indigo-50 to-indigo-100",
    },
    {
      id: 6,
      name: "WHO Health Topics",
      description: "Global health information and updates from World Health Organization",
      url: "https://www.who.int/health-topics",
      icon: "🌍",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "from-cyan-50 to-cyan-100",
    },
  ];

  const categories = ["all", "Wellness", "Mental Health", "Cardiology", "Diabetes", "Nutrition", "Sleep", "Fitness", "Women's Health"];

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full min-h-screen font-text bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-5">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-btn2 to-sky-500 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl">
                  <FaNewspaper className="text-3xl" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold">Health Articles</h1>
              </div>
              <p className="text-lg text-white/90">Stay informed with the latest health insights and expert advice</p>
            </div>
          </div>
        </motion.div>

        {/* ✅ EXTERNAL RESOURCES SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <FaGlobe className="text-btn2 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-800">Trusted Health Resources</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalResources.map((resource, index) => (
              <motion.a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gradient-to-br ${resource.bgColor} p-6 rounded-xl border-2 border-gray-200 hover:border-btn2 hover:shadow-xl transition-all duration-300 group cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`bg-gradient-to-r ${resource.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {resource.icon}
                  </div>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-btn2 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-btn2 transition-colors">
                  {resource.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {resource.description}
                </p>
                <div className="flex items-center gap-2 mt-4 text-btn2 font-semibold text-sm group-hover:gap-3 transition-all">
                  Visit Site
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100"
        >
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-300 focus:border-btn2 focus:ring-4 focus:ring-btn2/20 focus:outline-none transition-all text-lg"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-btn2 to-sky-500 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 font-semibold">
            Showing <span className="text-btn2 font-bold">{filteredArticles.length}</span> article{filteredArticles.length !== 1 ? "s" : ""}
            {selectedCategory !== "all" && <span> in <span className="text-btn2">{selectedCategory}</span></span>}
          </p>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:shadow-2xl hover:border-btn2 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-gradient-to-r from-btn2 to-sky-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-btn2 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FaUser className="text-btn2" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendar className="text-btn2" />
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaClock className="text-btn2" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-btn2 to-sky-500 text-white px-4 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-105"
                    >
                      Read Article
                      <FaExternalLinkAlt className="text-sm" />
                    </a>
                    <button className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-all">
                      <FaBookmark className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // No Results
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-gray-100"
          >
            <FaSearch className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600 text-xl font-semibold mb-2">No articles found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-6 bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all shadow-lg"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Want More Health Insights?</h3>
          <p className="text-gray-700 mb-6">Subscribe to our newsletter for weekly health tips and expert advice</p>
          <div className="flex flex-col md:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 focus:outline-none transition-all"
            />
            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl">
              Subscribe
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Articles;
