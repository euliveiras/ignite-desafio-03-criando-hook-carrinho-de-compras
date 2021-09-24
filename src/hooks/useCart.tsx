import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const productInCart = cart.find(product => product.id === productId);
      
      if(productInCart){
        updateProductAmount({productId, amount: productInCart.amount +1})

      } else {
          const { data: product } = await api.get(`/products/${productId}`); 
          
          const updatedProduct = {...product, amount: 1};
          localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cart, updatedProduct]));
          return setCart([...cart, updatedProduct]);
        }
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId);

      if(productInCart === undefined) {
        throw new Error();
      };

      const updatedCartWithoutRemovedProduct = cart.filter(item => item.id !== productId);
      
      setCart(updatedCartWithoutRemovedProduct);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCartWithoutRemovedProduct));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0){
        return;
      }
      
      const {data} = await api.get(`/stock/${productId}`);
      const stockAmount = data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const cartUpdated = cart.map(item => {
        return item.id === productId ? {...item, amount} : {...item};

      });

      setCart(cartUpdated)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
