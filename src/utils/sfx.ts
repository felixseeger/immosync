const sfxBase = '/sfx';

function play(slug: string) {
  try {
    const a = new Audio(`${sfxBase}/${slug}.mp3`);
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch {
    // ignore
  }
}

export const sfx = {
  menuOpen: () => play('menu-open'),
  menuSelect: () => play('menu-select'),
  menuClose: () => play('menu-close'),
};
