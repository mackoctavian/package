import React from 'react'
import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TopBar = () => {
    return (
        <div className="hidden lg:block w-full bg-slate-900 text-white py-2 text-sm">
            <div className="container mx-auto max-w-7xl px-4 flex justify-between items-center">
                {/* Contact Info */}
                <div className="flex items-center gap-6">
                    <a href="mailto:dmrc.vikindu@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Mail size={16} />
                        <span>dmrc.vikindu@gmail.com</span>
                    </a>
                    <a href="tel:+255765572679" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Phone size={16} />
                        <span>+255 765 572 679</span>
                    </a>
                </div>

                {/* Right Side: Socials & Language */}
                <div className="flex items-center gap-6">
                    {/* Social Links */}
                    <div className="flex items-center gap-4 border-r border-slate-700 pr-6">
                        <Link href="#" className="hover:text-primary transition-colors">
                            <Facebook size={16} />
                        </Link>
                        <Link href="#" className="hover:text-primary transition-colors">
                            <Twitter size={16} />
                        </Link>
                        <Link href="#" className="hover:text-primary transition-colors">
                            <Instagram size={16} />
                        </Link>
                        <Link href="#" className="hover:text-primary transition-colors">
                            <Linkedin size={16} />
                        </Link>
                    </div>

                    {/* Language Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 hover:text-primary transition-colors outline-none">
                            <span>English</span>
                            <ChevronDown size={14} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white text-slate-900 border-slate-200">
                            <DropdownMenuItem className="cursor-pointer hover:bg-slate-100">
                                English
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-slate-100">
                                Swahili
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}

export default TopBar
