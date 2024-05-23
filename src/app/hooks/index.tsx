"use client";
import { message } from "antd";
import { useState, useContext } from "react";
import { usePaystackPayment } from "react-paystack";
import { CartContext } from "../(component)/(Cart)/cartContext";
import emailjs from "@emailjs/browser";
const publicKey = "pk_test_119e8cd6b656668fe975c7f7ccae9709ebf4efa3";
type UsePaymentProps = {
  email: string;
  amount: number;
};
const usePayment = (props: UsePaymentProps) => {
  const { email, amount } = props;
  const [reference, setReference] = useState("");
  const { clearCart, cartItems, artPrints, shopArts, setShopArts } =
    useContext(CartContext);
  // function to update shopStore after purchase
  const updateSoldProperty = () => {
    // Create a set of IDs from the cart for quick lookup
    const cartIds = new Set(cartItems.map((item) => item.src));

    // Iterate over the items array and update the sold property if the item is in the cart
    const newShopArt = shopArts.map((item) => {
      if (cartIds.has(item.src)) {
        return { ...item, sold: true };
      }
      return item;
    });
    setShopArts([...shopArts, newShopArt]);
    console.log(newShopArt,'updated')

  };
  // function to dispatch email of purchased art
  const sendEmail = () => {
    // Prepare the data to send based on cart contents
    const emailParams = {
      to_name: `${email}`,
      from_name: "emmydollar98@gmail.com",
      message: prepareMessage(cartItems, artPrints),
    };

    emailjs
      .send(
        "service_gvu0kda",
        "template_z32i447",
        emailParams,
        "cWfTycNOYgmFGsksp"
      )
      .then(
        (result) => {
          console.log("Email successfully sent!", result.text);
        },
        (error) => {
          console.log("Failed to send email:", error.text);
        }
      );
  };
  const config = {
    reference: reference,
    email,
    amount: amount * 100, // Paystack uses kobo (multiply amount by 100)
    publicKey,
    currency: "NGN",
  };

  const initializePayment = usePaystackPayment(config);
  const handlePayClick = async () => {
    if (!email || !amount) {
      message.error("Please enter email and amount");
      return;
    }

    setReference(generateUniqueReference()); // Replace with a function to generate a unique reference

    try {
      await initializePayment({
        onSuccess: () => {
          sendEmail();
          message.success("Payment was successfull");
          updateSoldProperty();
          clearCart();
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      message.success(`Payment failed: ${error}`);
    }
  };

  return {
    handlePayClick,
  };
};

export default usePayment;

function generateUniqueReference() {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).slice(2, 7); // Generate a random string
  return `ref_${timestamp}-${randomPart}`;
}
// This function combines items from two cart arrays into a single message
const prepareMessage = (
  items1: Array<Record<string, any>>,
  items2: Array<Record<string, any>>
) => {
  // Format the items for each section
  const formatItems = (items: any, title: string) => {
    const formattedItems = items
      .map(
        (item: any) =>
          `Item: ${item.name}, Quantity: ${item.quantity ?? 1}, Price: ${
            item.price
          }`
      )
      .join("\n");

    return `${title}:\n${formattedItems}`;
  };

  // Format each section
  const originalsSection = formatItems(items1, "Originals");
  const printsSection = formatItems(items2, "Prints");

  // Combine both sections
  return `${originalsSection}\n\n${printsSection}`;
};