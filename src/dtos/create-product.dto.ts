export class CreateProductDto {
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
}
