export type ProductUnit = "kg" | "lb" | "g" | "L" | "mL";

export type Product =  {
    id: string;
    name: string;
    description: string | null;
    category: string;
    unit: ProductUnit;
    imageUrl: string | null;
    active: boolean;
    createdAt: Date;
};