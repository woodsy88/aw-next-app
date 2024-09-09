import { useForm } from "react-hook-form"
import * as Yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect } from "react"

const InputFormSchema = Yup.object().shape({
  text: Yup.string().required("Text is required."),
  language: Yup.string().required("Language is required."),
})

export default function TranslatorForm({ onSubmit, editingMessage, editingIndex }) {
  const form = useForm({
    resolver: yupResolver(InputFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      text: editingMessage ? editingMessage.content : "",
      language: "French",
    },
  })

  // Update form when editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      form.setValue("text", editingMessage.content);
    }
  }, [editingMessage, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data.text, data.language, editingIndex);
    form.reset({});
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="w-full flex flex-col align-start">
        <div className="flex w-full flex-col">
        <FormField
          name="language"
          render={({ field }) => (
            <FormItem className="w-full px-3 mb-6">
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex">
                  <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                    <FormControl>
                      <RadioGroupItem value="french" />
                    </FormControl>
                    <FormLabel className="font-normal">French</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="spanish" />
                    </FormControl>
                    <FormLabel className="font-normal">Spanish</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                    <FormControl>
                      <RadioGroupItem value="japanese" />
                    </FormControl>
                    <FormLabel className="font-normal">Japanese</FormLabel>
                  </FormItem>                  
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
          />          
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input 
                    className="h-12 w-full rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" 
                    placeholder="Enter text to translate" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>
        <Button type="submit" className="ml-3 h-12 bg-black">
          Translate
        </Button>              
      </form>
    </Form>
  )
}