import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: number;
  name: string;
}

interface Props {
  category: {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    description: string;
    order: number;
    image?: string | null;
  };
  parentCategories: Category[];
}

export default function Edit({ category, parentCategories }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: category.name,
    slug: category.slug,
    parent_id: category.parent_id ?? '',
    description: category.description ?? '',
    order: category.order ?? 0,
    image: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('categories.update', category.id));
  };

  return (
    <>
      <Head title="Edit Category" />
      <h1 className="text-2xl font-bold mb-6">Edit Category</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
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
          <Label>Parent Category</Label>
          <Select onValueChange={(value) => setData('parent_id', value)} value={String(data.parent_id)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Parent Category" />
            </SelectTrigger>
            <SelectContent>
              {parentCategories.map(parent => (
                <SelectItem key={parent.id} value={String(parent.id)}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.parent_id && <div className="text-red-500 text-sm">{errors.parent_id}</div>}
        </div>

        <div>
          <Label>Description</Label>
          <Textarea value={data.description} onChange={e => setData('description', e.target.value)} />
          {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
        </div>

        <div>
          <Label>Order</Label>
          <Input type="number" value={data.order} onChange={e => setData('order', Number(e.target.value))} />
          {errors.order && <div className="text-red-500 text-sm">{errors.order}</div>}
        </div>

        <div>
          <Label>Image (Upload to replace)</Label>
          <Input type="file" onChange={e => setData('image', e.target.files?.[0] || null)} />
          {errors.image && <div className="text-red-500 text-sm">{errors.image}</div>}
        </div>

        <Button type="submit" disabled={processing}>Update</Button>
        <Link href={route('categories.index')} className="ml-4">
          <Button variant="outline">Cancel</Button>
        </Link>
      </form>
    </>
  );
}
