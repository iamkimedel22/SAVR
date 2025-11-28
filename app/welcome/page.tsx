"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center transition-all duration-1000 ease-in-out">
      <div className="text-center opacity-0 animate-fade-in">
        <h1 className="text-7xl font-bold text-black tracking-wider drop-shadow-lg">SAVR</h1>
        <p className="text-black text-lg mt-4 opacity-75">Take control of your finances</p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
