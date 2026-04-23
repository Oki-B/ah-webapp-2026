const delay = (ms = 300) => {
  // Jika sedang testing, jangan berikan delay agar test cepat selesai
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = delay;