import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AttributeValue {
  id?: number;
  value: string;
}

interface Props {
  attribute: {
    id: number;
    name: string;
    slug: string;
    description: string;
    values: AttributeValue[];
  };
}

export default function Edit({ attribute }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: attribute.name,
    slug: attribute.slug,
    description: attribute.description,
    values: attribute.values.map(v => ({ id: v.id, value: v.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('attributes.update', attribute.id));
  };

  const addValue = () => {
    setData('values', [...data.values, { value: '' }]);
  };

  const removeValue = (index: number) => {
    setData('values', data.values.filter((_, i) => i !== index));
  };

  const updateValue = (index: number, newValue: string) => {
    const updatedValues = [...data.values];
    updatedValues[index].value = newValue;
    setData('values', updatedValues);
  };

  return (
    <>
      <Head title="Edit Attribute" />
      <h1 className="text-2xl font-bold mb-6">Edit Attribute</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <Label>Name</Label>
          <Input value={data.name} onChange={e => setData('name', e.target.value)} />
          {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
        </div>

        <div>
          <Label>Slug</Label>
          <Input value={data.slug} onChange={e => setData('slug', e.target.value)} />
          {errors.slug && <div className="text-red-500 text-sm">{errors.slug}</div>}
        </div>

        <div>
          <Label>Description</Label>
          <Textarea value={data.description} onChange={e => setData('description', e.target.value)} />
          {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
        </div>

        <div>
          <Label>Values</Label>
          <div className="space-y-2">
            {data.values.map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={value.value}
                  onChange={(e) => updateValue(index, e.target.value)}
                  placeholder={`Value ${index + 1}`}
                />
                <Button type="button" variant="destructive" onClick={() => removeValue(index)}>Remove</Button>
              </div>
            ))}
          </div>
          {errors.values && <div className="text-red-500 text-sm">{errors.values}</div>}
        </div>

        <Button type="button" variant="outline" onClick={addValue}>
          Add Value
        </Button>

        <div className="mt-6">
          <Button type="submit" disabled={processing}>Update</Button>
          <Link href={route('attributes.index')} className="ml-4">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </>
  );
}
