import React from 'react';
import './schoolLogos.css';

// School logos data
const SCHOOL_LOGOS = [
  {
    name: 'Harvard University',
    logo: 'https://1000logos.net/wp-content/uploads/2017/02/Harvard-Logo.png',
  },
  {
    name: 'Stanford University',
    logo: 'https://1000logos.net/wp-content/uploads/2018/02/Stanford-Cardinal-Logo.png',
  },
  {
    name: 'MIT',
    logo: 'https://1000logos.net/wp-content/uploads/2022/08/MIT-Logo.png',
  },
  {
    name: 'Yale University',
    logo: 'https://1000logos.net/wp-content/uploads/2018/03/Yale-Logo.png',
  },
  {
    name: 'Princeton University',
    logo: 'https://1000logos.net/wp-content/uploads/2018/03/Princeton-Logo.png',
  },
  {
    name: 'Columbia University',
    logo: 'https://1000logos.net/wp-content/uploads/2017/07/Columbia-University-Logo.png',
  },
  {
    name: 'University of Pennsylvania',
    logo: 'https://1000logos.net/wp-content/uploads/2018/03/University-of-Pennsylvania-Logo.png',
  },
  {
    name: 'Duke University',
    logo: 'https://1000logos.net/wp-content/uploads/2018/06/Duke-Blue-Devils-Logo.png',
  },
  {
    name: 'Brown University',
    logo: 'https://1000logos.net/wp-content/uploads/2021/06/Brown-University-emblem.png',
  },
  {
    name: 'Dartmouth College',
    logo: 'https://1000logos.net/wp-content/uploads/2017/10/Dartmouth-Logo.png',
  },
  {
    name: 'Northwestern University',
    logo: 'https://1000logos.net/wp-content/uploads/2018/06/Northwestern-Wildcats-Logo.png',
  },
  {
    name: 'UC Berkeley',
    logo: 'https://1000logos.net/wp-content/uploads/2018/05/UC-Berkeley-Logo.png',
  },
];

export const SchoolLogos: React.FC = () => {
  return (
    <div className="w-full py-6 overflow-hidden">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold text-academic-navy">Trusted by Students Accepted to Elite Universities</h3>
      </div>
      
      <div className="relative">
        {/* Gradient fade on left */}
        <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-academic-cream to-transparent z-10"></div>
        
        {/* Logos container with continuous animation */}
        <div className="flex logos-slide-animation">
          {/* First set of logos */}
          {SCHOOL_LOGOS.map((school, index) => (
            <div 
              key={`logo-1-${index}`} 
              className="mx-8 flex-shrink-0 flex items-center" 
              style={{ height: '60px', width: '120px' }}
            >
              <img 
                src={school.logo} 
                alt={`${school.name} logo`} 
                className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
              />
            </div>
          ))}
          
          {/* Duplicate set of logos for seamless looping */}
          {SCHOOL_LOGOS.map((school, index) => (
            <div 
              key={`logo-2-${index}`} 
              className="mx-8 flex-shrink-0 flex items-center" 
              style={{ height: '60px', width: '120px' }}
            >
              <img 
                src={school.logo} 
                alt={`${school.name} logo`} 
                className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
              />
            </div>
          ))}
        </div>
        
        {/* Gradient fade on right */}
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-academic-cream to-transparent z-10"></div>
      </div>
    </div>
  );
};

export default SchoolLogos; 