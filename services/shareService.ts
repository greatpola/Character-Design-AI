import { GeneratedImage } from '../types';

declare global {
  interface Window {
    Kakao: any;
  }
}

// Helper to convert Base64 to Blob/File
const base64ToFile = (base64Data: string, mimeType: string, filename: string): File => {
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
};

export const shareService = {
  // Check if native sharing (Files) is supported
  canShareFiles(): boolean {
    return !!(navigator.canShare && navigator.share);
  },

  // Primary method: Uses Web Share API (Works best on Mobile for Insta/Kakao/FB)
  async shareNative(image: GeneratedImage, title: string, text: string) {
    const file = base64ToFile(image.data, image.mimeType, 'character-design.png');
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: title,
          text: text,
          files: [file],
        });
        return true;
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return false;
      }
    }
    return false;
  },

  // Fallback: Copy Link
  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  // Fallback: Facebook URL Share
  shareFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  },

  // Kakao Link Share (Requires initialized SDK)
  shareKakao() {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        // Placeholder key - in a real app, this comes from env
        // If this fails, we catch the error
        try {
          window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY'); 
        } catch (e) {
          console.warn("Kakao SDK init failed (likely missing key)", e);
        }
      }

      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: 'Character Studio AI',
            description: 'AI로 나만의 캐릭터 브랜드를 만들어보세요.',
            imageUrl: 'https://via.placeholder.com/600x400?text=Character+Studio', // Placeholder since we can't upload dynamic image to Kakao without server
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
          buttons: [
            {
              title: '캐릭터 만들기',
              link: {
                mobileWebUrl: window.location.href,
                webUrl: window.location.href,
              },
            },
          ],
        });
      } catch (e) {
        alert('카카오톡 공유 설정이 필요합니다. (API 키 미설정)');
      }
    } else {
      alert('카카오톡 SDK가 로드되지 않았습니다.');
    }
  }
};