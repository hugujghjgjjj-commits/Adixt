import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Stars, Sparkles, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';

function IntroContent({ onComplete }: { onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Rotate the entire scene slightly
      groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
      groupRef.current.rotation.z = Math.cos(time * 0.1) * 0.05;
    }

    if (textRef.current) {
      // Glitch effect on text position
      if (Math.random() > 0.98) {
        textRef.current.position.x = (Math.random() - 0.5) * 0.2;
        textRef.current.position.y = (Math.random() - 0.5) * 0.2;
      } else {
        textRef.current.position.x = 0;
        textRef.current.position.y = 0;
      }
    }
    
    // End animation after 4.5 seconds
    if (time > 4.5) {
      onComplete();
    }
  });

  return (
    <group ref={groupRef}>
      <color attach="background" args={['#000000']} />
      
      {/* Dynamic Background */}
      <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={2} />
      
      {/* Floating Particles */}
      <Sparkles count={200} scale={12} size={6} speed={0.4} opacity={0.8} color="#CCFF00" />
      <Sparkles count={100} scale={10} size={10} speed={0.2} opacity={0.5} color="#00FFFF" />

      {/* Main Text */}
      <Float speed={4} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text
          ref={textRef}
          fontSize={3.5}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#00FFFF"
        >
          ADIXT
          <meshStandardMaterial 
            color="#000000"
            emissive="#CCFF00"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </Text>
      </Float>

      {/* Subtitle */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2} position={[0, -2, 0]}>
        <Text
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.2}
        >
          FUTURE OF FASHION
          <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.5} />
        </Text>
      </Float>
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#00FFFF" />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#CCFF00" />
      <spotLight position={[0, 10, 0]} intensity={1} angle={0.5} penumbra={1} color="#CCFF00" />
    </group>
  );
}

export default function IntroAnimation() {
  const [show, setShow] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShow(false);
    } else {
      setMounted(true);
      // Fallback to ensure intro closes even if animation fails
      const timer = setTimeout(() => {
        handleComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    sessionStorage.setItem('hasSeenIntro', 'true');
    setShow(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-black"
        >
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <IntroContent onComplete={handleComplete} />
          </Canvas>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
