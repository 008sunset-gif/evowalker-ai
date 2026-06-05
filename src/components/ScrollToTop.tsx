import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ページ遷移（pathname の変化）ごとに表示位置を最上部へ戻す共通コンポーネント。
 * 前ページのスクロール位置が残って画面下部から始まる不自然な挙動を防ぐ。
 * Router 配下に一度だけマウントして全画面に効かせる（各ページへの個別実装は行わない）。
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
