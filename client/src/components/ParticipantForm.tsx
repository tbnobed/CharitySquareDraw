import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { participantFormSchema, type ParticipantForm } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, X } from "lucide-react";

interface ParticipantFormProps {
  selectedSquares: number[];
  pricePerSquare: number;
  onRemoveSquare: (square: number) => void;
  onSubmit: (data: ParticipantForm) => void;
  isLoading?: boolean;
}

export function ParticipantFormComponent({ selectedSquares, pricePerSquare, onRemoveSquare, onSubmit, isLoading }: ParticipantFormProps) {
  const form = useForm<ParticipantForm>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      squares: selectedSquares,
    },
  });

  // Update form when selectedSquares changes
  useEffect(() => {
    form.setValue('squares', selectedSquares);
  }, [selectedSquares, form]);

  const handleSubmit = (data: ParticipantForm) => {
    onSubmit({ ...data, squares: selectedSquares });
  };

  const totalAmount = selectedSquares.length * (pricePerSquare / 100); // Convert from cents to dollars

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Participant Information</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Full Name *</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-name"
                    placeholder="Enter full name"
                    {...field}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email Address *</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-email"
                    type="email"
                    placeholder="Enter email address"
                    {...field}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Phone Number *</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...field}
                    onInput={(e) => {
                      // Only allow digits, spaces, parentheses, and dashes
                      const value = e.currentTarget.value.replace(/[^0-9\s()-]/g, '');
                      e.currentTarget.value = value;
                      field.onChange(value);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selected Squares */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Selected Squares</h4>
            <div className="min-h-[40px] flex flex-wrap gap-2" data-testid="selected-squares">
              {selectedSquares.length === 0 ? (
                <p className="text-sm text-gray-500">No squares selected</p>
              ) : (
                selectedSquares.map(square => (
                  <Badge 
                    key={square}
                    variant="secondary"
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                    data-testid={`selected-square-${square}`}
                  >
                    #{square}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-4 w-4 p-0 text-yellow-600 hover:text-yellow-800"
                      onClick={() => onRemoveSquare(square)}
                      data-testid={`remove-square-${square}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Squares: <span data-testid="selected-count">{selectedSquares.length}</span></span>
                <span className="font-medium text-gray-900">Total: $<span data-testid="total-amount">{totalAmount}</span></span>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit"
            disabled={selectedSquares.length === 0 || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            data-testid="button-reserve"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Reserve Squares
          </Button>
        </form>
      </Form>
    </div>
  );
}
