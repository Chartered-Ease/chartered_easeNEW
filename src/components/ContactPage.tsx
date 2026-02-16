import React, { useState } from 'react';
import { LoaderIcon } from './icons/LoaderIcon';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      console.log('Form submitted:', formData);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-ease-green">Thank You!</h2>
        <p className="mt-4 text-gray-700">Your message has been sent successfully. Our team will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Get In Touch</h1>
          <p className="mt-2 text-gray-600">We're here to help. Ask us anything or share your feedback.</p>
        </div>

        <div className="mt-12 max-w-4xl mx-auto grid md:grid-cols-2 gap-12 bg-gray-50 p-8 rounded-lg shadow-md">
          {/* Contact Info */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-ease-blue">General Inquiries</h3>
              <a href="mailto:aashray@charteredease.in" className="text-gray-700 hover:underline">aashray@charteredease.in</a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ease-blue">Registered Address</h3>
              <p className="text-gray-700">123 Digital Avenue, Tech Park<br />Pune, India</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ease-blue">Instant Support</h3>
               <a 
                href="https://wa.me/917477282139"
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.203 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ease-blue focus:border-ease-blue" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ease-blue focus:border-ease-blue" />
            </div>
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile Number <span className="text-xs text-gray-500">(Optional)</span></label>
              <input type="tel" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ease-blue focus:border-ease-blue" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea id="message" name="message" rows={4} required value={formData.message} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ease-blue focus:border-ease-blue"></textarea>
            </div>
            <div>
              <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-blue disabled:bg-ease-blue/50">
                {isSubmitting ? <LoaderIcon /> : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
