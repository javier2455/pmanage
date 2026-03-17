export interface PlanResponse {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number | null;
  maxProducts: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}