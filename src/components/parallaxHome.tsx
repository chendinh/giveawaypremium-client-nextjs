'use client';

import { useEffect } from 'react';

const ParallaxHome = () => {
  useEffect(() => {
    (function () {
      // Add event listener
      document.addEventListener('mousemove', parallax);
      const elem = document.querySelector('#parallax') as HTMLElement | null;
      // Magic happens here
      function parallax(e) {
        const _w = window.innerWidth / 2;
        const _h = window.innerHeight / 2;
        const _mouseX = e.clientX;
        const _mouseY = e.clientY;
        const _depth1 = `${50 - (_mouseX - _w) * 0.003}% ${50 - (_mouseY - _h) * 0.003}%`;
        const _depth2 = `${50 - (_mouseX - _w) * 0.003}% ${50 - (_mouseY - _h) * 0.003}%`;
        const _depth3 = `${25 - (_mouseX - _w) * 0.004}% ${70 - (_mouseY - _h) * 0.002}%`;
        const x = `${_depth3}, ${_depth2}, ${_depth1}`;
        // console.log(x)
        if (elem) {
          elem.style.backgroundPosition = x;
        }
      }
    })();

    setTimeout(() => {
      const elem = document.querySelector('#parallax') as HTMLElement | null;
      if (elem) {
        elem.style.transition = 'all 1s';
        elem.style.opacity = '1';
      }
    }, 800);
  }, []);

  return <div id="parallax" />;
};

export default ParallaxHome;
