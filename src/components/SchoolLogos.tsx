import React from 'react';
import './schoolLogos.css';

// School logos data with more reliable sources
const SCHOOL_LOGOS = [
  {
    name: 'Harvard University',
    logo: '/images/school-logos/harvard.png',
  },
  {
    name: 'Stanford University',
    logo: '/images/school-logos/stanford.png',
  },
  {
    name: 'MIT',
    logo: '/images/school-logos/mit.png',
  },
  {
    name: 'Yale University',
    logo: '/images/school-logos/yale.png',
  },
  {
    name: 'Princeton University',
    logo: '/images/school-logos/princeton.png',
  },
  {
    name: 'Columbia University',
    logo: '/images/school-logos/columbia.png',
  },
  {
    name: 'University of Pennsylvania',
    logo: '/images/school-logos/upenn.png',
  },
  {
    name: 'Duke University',
    logo: '/images/school-logos/duke.png',
  },
  {
    name: 'Brown University',
    logo: '/images/school-logos/brown.png',
  },
  {
    name: 'Dartmouth College',
    logo: '/images/school-logos/dartmouth.png',
  },
  {
    name: 'Northwestern University',
    logo: '/images/school-logos/northwestern.png',
  },
  {
    name: 'UC Berkeley',
    logo: '/images/school-logos/berkeley.png',
  },
];

export const SchoolLogos: React.FC = () => {
  return (
    <div className="w-full py-8 overflow-hidden">
      <div className="relative">
        {/* Gradient fade on left */}
        <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-academic-cream/50 to-transparent z-10"></div>
        
        {/* Logos container with continuous animation */}
        <div className="flex logos-slide-animation">
          {/* First set of logos */}
          {SCHOOL_LOGOS.map((school, index) => (
            <div 
              key={`logo-1-${index}`} 
              className="mx-6 flex-shrink-0 flex items-center justify-center" 
              style={{ height: '100px', width: '180px' }}
            >
              <img 
                src={school.logo} 
                alt={`${school.name} logo`} 
                className="max-h-[70px] max-w-[160px] object-contain grayscale hover:grayscale-0 transition-all opacity-90 hover:opacity-100 hover:scale-110 duration-300"
              />
            </div>
          ))}
          
          {/* Duplicate set of logos for seamless looping */}
          {SCHOOL_LOGOS.map((school, index) => (
            <div 
              key={`logo-2-${index}`} 
              className="mx-6 flex-shrink-0 flex items-center justify-center" 
              style={{ height: '100px', width: '180px' }}
            >
              <img 
                src={school.logo} 
                alt={`${school.name} logo`} 
                className="max-h-[70px] max-w-[160px] object-contain grayscale hover:grayscale-0 transition-all opacity-90 hover:opacity-100 hover:scale-110 duration-300"
              />
            </div>
          ))}
        </div>
        
        {/* Gradient fade on right */}
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-academic-cream/50 to-transparent z-10"></div>
      </div>
    </div>
  );
};

export default SchoolLogos; 