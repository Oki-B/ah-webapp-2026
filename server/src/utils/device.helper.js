const getSimpleDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';

  const ua = userAgent.toLowerCase();

  // Deteksi OS
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh')) os = 'MacOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Deteksi Browser
  let browser = 'Unknown Browser';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';

  return `${browser} on ${os}`;
};

module.exports = { getSimpleDeviceName };