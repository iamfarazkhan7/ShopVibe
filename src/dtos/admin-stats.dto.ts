export class AdminStatsResponseDto {
  totalOrders: number;
  totalRevenue: number;
  topProducts: {
    id: string;
    title: string;
    price: number;
    rating: number;
    stock: number;
  }[];
}
