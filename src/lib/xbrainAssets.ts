import lab1Jpg from '../../public/assets/images/lab1.jpg';
import presenterJpg from '../../public/assets/images/presenter.jpg';
import lab2Jpg from '../../public/assets/images/lab2.jpg';
import logoPrimaryPng from '../../public/assets/images/xbrain-logo-primary.png';
import logoWhitePng from '../../public/assets/images/xbrain-logo-white.png';
import xbrainCssRaw from '../../public/assets/styles/xbrain.css?raw';
import xbrainSpriteSvgRaw from '../../public/assets/icons/xbrain-sprite.svg?raw';

export const BRAND_PHOTOS: Record<string, string> = {
  lab1: lab1Jpg,
  presenter: presenterJpg,
  lab2: lab2Jpg,
};

export const XBRAIN_LOGOS: Record<string, string> = {
  primary: logoPrimaryPng,
  white: logoWhitePng,
};

export const XBRAIN_EMBEDDED_CSS: string = xbrainCssRaw;

export const XBRAIN_SVG_SPRITE: string = xbrainSpriteSvgRaw
  .replace('__ASSET_XBRAIN_LOGO_PRIMARY__', logoPrimaryPng)
  .replace('__ASSET_XBRAIN_LOGO_WHITE__', logoWhitePng);
