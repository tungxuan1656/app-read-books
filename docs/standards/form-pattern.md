# Form Pattern (shadcn + react-hook-form + zod)

Standard pattern for writing forms in a React + TypeScript project following shadcn guidelines.

## 1) Principles

- Use `zod` to define a single schema for validation.
- Use `useForm` + `zodResolver` to bind the schema to the form.
- Use `Controller` for controlled field types (`Select`, `Switch`, `Checkbox`, `RadioGroup`, ...).
- Always include:
  - `data-invalid={fieldState.invalid}` on `Field`
  - `aria-invalid={fieldState.invalid}` on input control
  - `FieldError` to display errors
- `defaultValues` must be complete according to the schema.
- Set explicit `id` for controls and map with `FieldLabel htmlFor`.

## 2) Standard Skeleton

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  title: z.string().min(3, 'Minimum 3 characters').max(50, 'Maximum 50 characters'),
  description: z.string().min(10, 'Minimum 10 characters'),
})

type FormValues = z.infer<typeof formSchema>

export function ExampleForm(): React.JSX.Element {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
    mode: 'onSubmit', // can change to onChange/onBlur depending on UX
  })

  const onSubmit = (values: FormValues): void => {
    // call API / mutation
    console.log(values)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
      <FieldGroup>
        <Controller
          name='title'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='form-title'>Title</FieldLabel>
              <Input
                {...field}
                id='form-title'
                aria-invalid={fieldState.invalid}
                placeholder='Enter title'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='description'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='form-description'>Description</FieldLabel>
              <Input
                {...field}
                id='form-description'
                aria-invalid={fieldState.invalid}
                placeholder='Enter description'
              />
              <FieldDescription>This information will be displayed to users.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className='flex items-center gap-2'>
        <Button type='button' variant='outline' onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type='submit'>Save</Button>
      </div>
    </form>
  )
}
```

## 3) Patterns by Field Type

### Input / Textarea

- Spread `...field` directly onto the control.
- Include `aria-invalid` + `FieldError`.

### Select

- Manually bind `value` + `onValueChange={field.onChange}`.
- Do not spread the entire `field` onto `Select`.

### Checkbox / Switch

- Use `checked` + `onCheckedChange`.
- For checkbox arrays: manipulate the array using `includes`, `filter`, `push` on `field.value`.

### RadioGroup

- Bind `value` + `onValueChange`.

## 4) Implementation Rules in the Project

- Schema placed near the form or separated into `*.schema.ts` if the form is large.
- Submit type uses `z.infer<typeof formSchema>` to be 100% in sync with the schema.
- API error responses map to `form.setError` when needed.
- Forms with multiple sections should split into smaller components by section, but keep 1 `useForm` at the root form.

## 5) PR Checklist for Forms

- [ ] Has `zodResolver` and clear schema
- [ ] Has complete `defaultValues`
- [ ] Has `data-invalid`, `aria-invalid`, `FieldError`
- [ ] Has `Reset` button (if appropriate)
- [ ] Has clear submit/loading/disabled handling
- [ ] Type-safe with `z.infer`
