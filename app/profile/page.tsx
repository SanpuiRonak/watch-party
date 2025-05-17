"use client"
import { Button, Field, Input } from '@chakra-ui/react'
import React from 'react'

export default function RegisterUser() {
  return (
    <Field.Root>
    <Field.Label>Pick an username</Field.Label>
    <Input placeholder="A cool username" />
    <Button>Proceed</Button>
  </Field.Root>
  )
}
