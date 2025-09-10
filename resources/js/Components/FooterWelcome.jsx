import React from 'react';
import { Link } from '@inertiajs/react';
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram } from 'lucide-react';

const SocialIcon = ({ href, icon: Icon, label }) => (
    <a href={href} className="text-blue-300 hover:text-white transition-colors">
        <span className="sr-only">{label}</span>
        <Icon className="h-6 w-6" />
    </a>
);

export default function FooterWelcome({ footerData }) {

    const data = footerData || {};

    return (
        <footer className="bg-blue-900">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-blue-200">

                    {/* Branding Section */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-4 mb-4">
                            <img 
                                className="h-16 w-16 rounded-full object-cover ring-2 ring-white/50" 
                                src={data.footer_logo_url || '/images/gapanlogo.png'}
                                alt="Official Seal" 
                            />
                            <div>
                                <h2 className="text-lg font-bold text-white leading-tight">{data.footer_title || 'Doconnect'}</h2>
                                <p className="text-sm text-blue-300">{data.footer_subtitle || 'Gapan City'}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Contact Details */}
                    <div>
                        <h3 className="text-sm font-semibold text-sky-400 tracking-wider uppercase">Contact Details</h3>
                        <ul className="mt-4 space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-sky-400 mt-1 shrink-0" />
                                <p className="text-base">{data.footer_address || 'Brgy. Hall, Gapan City, 3105'}</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-sky-400 mt-1 shrink-0" />
                                <a href={`mailto:${data.footer_email}`} className="text-base hover:text-white transition-colors">{data.footer_email || 'contact@site.com'}</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-sky-400 mt-1 shrink-0" />
                                <a href={`tel:${data.footer_phone}`} className="text-base hover:text-white transition-colors">{data.footer_phone || '(044) 123-4567'}</a>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-sky-400 tracking-wider uppercase">Quick Links</h3>
                        <ul className="mt-4 space-y-3">
                            <li><a href="/#how-it-works" className="text-base hover:text-white transition-colors">How It Works</a></li>
                            <li><a href="/#services" className="text-base hover:text-white transition-colors">Services</a></li>
                            <li><a href="/#officials" className="text-base hover:text-white transition-colors">Officials</a></li>
                            <li><a href="/#faq" className="text-base hover:text-white transition-colors">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-sm font-semibold text-sky-400 tracking-wider uppercase">Resources</h3>
                        <ul className="mt-4 space-y-3">
                            <li><Link href="#" className="text-base hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-base hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-blue-800 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-sm text-blue-300 text-center sm:text-left">
                        &copy; {new Date().getFullYear()} {data.footer_title || 'Doconnect'}. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 sm:mt-0">
       
                        <SocialIcon href="#" icon={Facebook} label="Facebook" />
                        <SocialIcon href="#" icon={Twitter} label="Twitter" />
                        <SocialIcon href="#" icon={Instagram} label="Instagram" />
                    </div>
                </div>
            </div>
        </footer>
    );
};