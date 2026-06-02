import { animate } from 'https://esm.sh/animejs';

console.log("Career animation loaded");

/* Animate squares */
animate('.square', {
  x: el => el.getAttribute('data-x'),

  rotate: () => Math.random() * 360 - 180,

  duration: 2200,

  delay: (_, i) => i * 200,

  loop: false,

  alternate: true,

  ease: 'inOutExpo'
});
