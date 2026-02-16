import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-ease-blue text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Our Mission: To Radically Improve India’s Ease of Doing Business
          </h1>
          <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            We are leveraging AI to build the simplest, fastest, and most transparent platform for every Indian entrepreneur.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Our Story</h2>
            <div className="mt-4 w-24 h-1 bg-ease-saffron mx-auto rounded"></div>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed text-center">
            For too long, navigating India's bureaucratic landscape has been a maze of paperwork, confusing regulations, and endless delays. Ambitious entrepreneurs and honest taxpayers deserve better.
            <br /><br />
            Chartered Ease was born from this frustration. We saw a future where technology, powered by AI, could slice through the red tape, making business registration and compliance as simple as a conversation. We're here to empower every Indian with the tools to turn their business dreams into reality, effortlessly.
          </p>
        </div>
      </section>

      {/* Vision 2030 Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Our Vision 2030</h2>
           <div className="mt-4 w-24 h-1 bg-ease-green mx-auto rounded"></div>
          <p className="mt-6 text-lg text-gray-700 leading-relaxed">
            To be the driving force that propels India into the <span className="font-bold text-ease-blue">top 10 of the World Bank's 'Ease of Doing Business' rankings</span>. We envision a nation where starting and managing a business is so straightforward that anyone with a great idea can contribute to our collective growth story.
          </p>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Meet the Founder</h2>
            <div className="mt-4 w-24 h-1 bg-ease-blue mx-auto rounded"></div>
            <div className="mt-12 flex flex-col items-center">
                <img 
                    className="h-32 w-32 rounded-full object-cover shadow-lg" 
                    src="https://i.pravatar.cc/150?u=aashray" 
                    alt="Founder of Chartered Ease"
                />
                <h3 className="mt-6 text-2xl font-bold text-gray-900">Aashray</h3>
                <p className="text-gray-500 font-medium">Founder & Visionary of Chartered Ease</p>
                <p className="mt-4 max-w-2xl text-gray-700 leading-relaxed">
                    With over a decade of experience in fintech and a passion for simplifying complex systems, Aashray founded Chartered Ease to democratize access to business services for all Indians. His vision is to build a transparent, efficient, and user-centric platform that becomes the backbone of India's entrepreneurial ecosystem.
                </p>
            </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;