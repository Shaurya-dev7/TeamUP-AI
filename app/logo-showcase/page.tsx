import React from 'react';
import { LogoMinimalist, LogoTypography, LogoSymbol } from '@/components/logos/LogoConcepts';

export default function LogoShowcase() {
    return (
        <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center gap-16">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-[#FFD700]">Logo Concepts</h1>
                <p className="text-gray-400 text-lg">Reviewing options for TeamUp</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-6xl">
                {/* Concept 1 */}
                <div className="bg-[#111] border border-[#333] p-10 rounded-2xl flex flex-col items-center justify-center hover:border-[#FFD700] transition-colors duration-300 group cursor-pointer shadow-lg hover:shadow-[#FFD700]/20">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                        <LogoMinimalist className="w-40 h-40" />
                    </div>
                    <p className="mt-8 text-gray-500 text-sm">Concept 1: Modern & Geometric</p>
                </div>

                {/* Concept 2 */}
                <div className="bg-[#111] border border-[#333] p-10 rounded-2xl flex flex-col items-center justify-center hover:border-[#FFD700] transition-colors duration-300 group cursor-pointer shadow-lg hover:shadow-[#FFD700]/20">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                        {/* Adjust sizing for wide typography logo */}
                        <LogoTypography className="w-64 h-32" />
                    </div>
                    <p className="mt-8 text-gray-500 text-sm">Concept 2: Bold Typography</p>
                </div>

                {/* Concept 3 */}
                <div className="bg-[#111] border border-[#333] p-10 rounded-2xl flex flex-col items-center justify-center hover:border-[#FFD700] transition-colors duration-300 group cursor-pointer shadow-lg hover:shadow-[#FFD700]/20">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                        <LogoSymbol className="w-40 h-40" />
                    </div>
                    <p className="mt-8 text-gray-500 text-sm">Concept 3: Connected & Social</p>
                </div>
            </div>

            <div className="text-gray-500 text-center max-w-md">
                <p>Please select your preferred design direction. We can further refine colors, shapes, or fonts based on your feedback.</p>
            </div>
        </div>
    );
}
