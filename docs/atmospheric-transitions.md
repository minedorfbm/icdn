# Fluid chapter transitions

The first CSS mist experiments were rejected visually. They are removed, not retained as a second effect system. `AtmosphericTransition` now draws a small procedural surface in each existing transition space. Cards, level layouts, photo opacity and scrolling behavior are outside its scope.

## Research and direction

Public references reviewed:

- [ShaderGradient](https://github.com/ruucm/shadergradient), MIT: moving lit surfaces rather than flat color interpolation.
- [Ripple](https://github.com/m1ckc3s/ripple), MIT: irregular noise-warped wavefronts driven by a single progress value. Its RGB splitting, intense glow and example images are not used.
- [Creative WebGL Image Transitions](https://github.com/akella/webGLImageTransitions): custom shader-based transition research.
- [The Book of Shaders: fBM and domain warping](https://thebookofshaders.com/13/): procedural surface concepts.

The implementation and shaders are original; no repository source, media or runtime dependency is vendored. These references inform the technique, not a copied visual preset.

## Rendering and limits

- A tiny lazily imported raw WebGL renderer, without Three.js, GSAP or a render loop.
- A single triangle per visible passage; three noise octaves. Resolution is capped at 1280px wide and DPR 1, with no framebuffer chains, image textures or blur filters.
- Scroll/resize events coalesce into one animation frame. Offscreen passages and hidden documents do not draw. Stationary pages do not animate.
- All palette colors are converted from the live CSS variables to browser sRGB, including Sky's OKLCH color. The two ends resolve to their adjacent level colors.
- Ivory becomes daylight blue before the deep Sky color; Sky/Earth uses layered jade contours; Earth/Sea has thin reflected wavefronts.
- Original inline SVG curves supply the SSR, reduced-motion, no-WebGL and context-loss fallback. Reduced-motion mode does not initialize the renderer.
- Shader failure affects decoration only. Observers, listeners, frames and GL program resources are disposed on unmount.

There is no unconditional 60 FPS guarantee: performance depends on the device and graphics driver. The bounded surface and on-demand drawing limit work, and the vector fallback retains the visual transition without graphics support.
