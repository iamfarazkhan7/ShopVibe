import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [ordersCount, revenue, topProducts] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
      }),
      this.prisma.product.findMany({
        orderBy: { rating: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          price: true,
          rating: true,
          stock: true,
        },
      }),
    ]);

    return {
      totalOrders: ordersCount,
      totalRevenue: revenue._sum.total || 0,
      topProducts,
    };
  }
}
