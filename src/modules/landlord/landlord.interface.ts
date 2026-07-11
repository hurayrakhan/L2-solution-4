export interface IPropertyCreateInput {
  title: string;
  description: string;
  location: string;
  price: number;
  categoryId: string;
  amenities?: string[];
  images?: string[];
}

export interface IPropertyUpdateInput {
  title?: string;
  description?: string;
  location?: string;
  price?: number;
  categoryId?: string;
  amenities?: string[];
  images?: string[];
  availability?: boolean;
}
