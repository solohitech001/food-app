export interface FoodFeedDto {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  video: string | null;
  price: number;

  vendor: {
    id: string;
    name: string;
    handle: string;
  };

  stats: {
    likes: number;
    saves: number;
    shares: number;
  };

  actions: {
    liked: boolean;
    saved: boolean;
    canShare: boolean;
  };
}
