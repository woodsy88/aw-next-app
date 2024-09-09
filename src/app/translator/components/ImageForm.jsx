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

const InputFormSchema = Yup.object().shape({
  description: Yup.string().required("Text is required."),

})

export default function ImageForm({ onSubmit }) {
  const form = useForm({
    resolver: yupResolver(InputFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      description:  ""
    }
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    console.log(data)
    await onSubmit(data.description);
    form.reset({});
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="w-full flex flex-col align-start">
        <FormField
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}  
        />
        <Button type="submit">Create Image</Button>
      </form>
    </Form>
  )


}