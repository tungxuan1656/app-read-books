# Dialog & Form Field Pattern

## General Principles

1. **Prefer built-in components** — `Dialog`, `Field`, `FieldGroup`, `Button`, `Input`, `Textarea`, `Select`... Only write custom UI when explicitly requested.
2. **Dialog uses ref pattern** — modal manages its own internal state (`open`, `dismiss`); caller only needs `ref.current?.open(options)`.
3. **`FieldLabel` is the default** — only use `FieldLegend` when the field is a group of multiple controls on multiple lines (single line still uses `FieldLabel`) or when explicitly requested.
4. **Do not hardcode padding/spacing on DialogContent unless necessary**

---

## 1. Simple Dialog (ref pattern)

Modal manages its own `open` state. Does not receive `open` / `onOpenChange` props from outside.

```tsx
// components/shared/confirm-delete-modal.tsx
import { useImperativeHandle, useRef, useState, type Ref } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export type ConfirmDeleteModalRef = {
  open: (options: { itemName: string; onConfirm: () => void }) => void
}

export const ConfirmDeleteModal = ({ ref }: { ref?: Ref<ConfirmDeleteModalRef> }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const onConfirmCallback = useRef<(() => void) | null>(null)

  useImperativeHandle(ref, () => ({
    open: ({ itemName, onConfirm }) => {
      setItemName(itemName)
      onConfirmCallback.current = onConfirm
      setIsOpen(true)
    },
  }))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {itemName}?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button
            variant='destructive'
            onClick={() => {
              onConfirmCallback.current?.()
              setIsOpen(false)
            }}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Usage:**

```tsx
const deleteRef = useRef<ConfirmDeleteModalRef>(null)

// Open modal
deleteRef.current?.open({
  itemName: driver.name,
  onConfirm: () => mutateDelete(driver.id),
})

// JSX — no state related to the modal
<ConfirmDeleteModal ref={deleteRef} />
```

---

## 2. Dialog + Form Fields

Use `FieldGroup` > `Field` > `FieldLabel` + control. `FieldError` displays validation errors. `DialogClose asChild` for Cancel button.

```tsx
// components/shared/edit-profile-modal.tsx
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const EditProfileModal = ({ ref }: { ref?: Ref<EditProfileModalRef> }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your display name.</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='name'>Name</FieldLabel>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FieldError>{error}</FieldError>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 3. Standalone Form Fields (outside dialog)

Use `FieldGroup` + `Field` directly in page/section.

```tsx
// pages/settings/profile-section.tsx
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const ProfileSection = () => (
  <form onSubmit={handleSubmit}>
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor='display-name'>Display Name</FieldLabel>
        <FieldDescription>Shown publicly on your profile.</FieldDescription>
        <Input id='display-name' defaultValue='John' />
        <FieldError errors={errors.displayName} />
      </Field>

      <Field>
        <FieldLabel htmlFor='bio'>Bio</FieldLabel>
        <Textarea id='bio' defaultValue='...' />
      </Field>
    </FieldGroup>

    <Button type='submit'>Save changes</Button>
  </form>
)
```

---

## When to Use FieldLegend vs FieldLabel

| Component | HTML | Use When |
|---|---|---|
| `FieldLabel` | `<label>` | Field has **1 clear control** (Input, Select, Textarea). Linked via `htmlFor`. |
| `FieldLegend` | `<legend>` | Field is a **group** of multiple related controls on multiple lines (single line still uses `FieldLabel`) or when explicitly requested. Does not use `htmlFor`. |

```tsx
// ✅ FieldLabel — 1 input
<Field>
  <FieldLabel htmlFor='email'>Email</FieldLabel>
  <Input id='email' type='email' />
</Field>

// ✅ FieldLegend — group of multiple controls
<Field>
  <FieldLegend>Work Hours</FieldLegend>
  <div className='flex gap-2'>
    <Select>...</Select>  {/* start time */}
    <Select>...</Select>  {/* end time */}
  </div>
</Field>

// ❌ Wrong — using FieldLegend for a single input
<Field>
  <FieldLegend>Email</FieldLegend>
  <Input id='email' />
</Field>
```

---

## Quick Checklist

- [ ] Dialog uses `ref` pattern — does not receive `open` props from outside
- [ ] Callback stored in `useRef`, not using state to store functions
- [ ] `DialogClose asChild` for Cancel button — no manual `onClick={() => setIsOpen(false)}`
- [ ] Use `FieldGroup` > `Field` > `FieldLabel` / `FieldLegend` instead of custom `div` + `h3`
- [ ] `FieldError` for validation messages instead of manual `<p className='text-danger'>`
- [ ] Do not hardcode padding/spacing on DialogContent unless necessary
