"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Smartphone, 
  Banknote,
  Wallet 
} from "lucide-react";

const paymentMethods = [
  {
    id: "alipay",
    name: "支付宝",
    icon: <Wallet className="h-5 w-5 text-blue-500" />,
  },
  {
    id: "wechat",
    name: "微信支付",
    icon: <Smartphone className="h-5 w-5 text-green-500" />,
  },
  {
    id: "creditcard",
    name: "信用卡支付",
    icon: <CreditCard className="h-5 w-5 text-purple-500" />,
  },
  {
    id: "cash",
    name: "货到付款",
    icon: <Banknote className="h-5 w-5 text-orange-500" />,
  },
];

interface PaymentMethodProps {
  onMethodSelect: (method: string) => void;
}

export default function PaymentMethod({ onMethodSelect }: PaymentMethodProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("alipay");

  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);
    onMethodSelect(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>支付方式</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod}
          onValueChange={handleMethodChange}
          className="space-y-3"
        >
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent"
            >
              <RadioGroupItem value={method.id} id={`method-${method.id}`} />
              <Label
                htmlFor={`method-${method.id}`}
                className="flex flex-1 cursor-pointer items-center"
              >
                <div className="mr-3">{method.icon}</div>
                <div className="font-medium">{method.name}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
} 