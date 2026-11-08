import React, { useMemo } from 'react';
import { XBRAIN_SVG_SPRITE } from '../../lib/xbrainAssets';

export const SvgDefs: React.FC = () => {
  const innerDefs = useMemo(() => {
    const match = XBRAIN_SVG_SPRITE.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    return match ? match[1] : XBRAIN_SVG_SPRITE;
  }, []);

  return (
    <svg
      width="0"
      height="0"
      className="v1-svg-defs"
      aria-hidden="true"
      style={{ position: 'absolute', overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: innerDefs }}
    />
  );
};
