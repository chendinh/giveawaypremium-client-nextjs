import { useEffect, useState } from 'react';

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Returns the current width of the screen.
 *
 * @returns {number} The current width of the screen.
 */
/*******  f3e3370c-3efc-4b5e-bfbe-aff70e5e96b2 *******/
export function useScreenWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

// Usage:
// const width = useScreenWidth();
