import groq from 'groq'

const blogCategoriesQuery = groq`
*[_type == "category"] | order(title asc){
  _id,
  title,
  slug,
  description,
  image{asset, alt, crop, hotspot},
  "postCount": count(*[_type == "post" && references(^._id) && (!defined(publishedAt) || publishedAt <= now())])
}`

export const categoryOnly = groq`
*[_type == "category" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  description,
  image{asset->{url}, alt}
}`

export const postsForCategory = groq`
*[_type == "post" && references($categoryId) && (!defined(publishedAt) || publishedAt <= now())]
  | order(publishedAt desc)[$start...$end]{
    _id,
    title,
    "excerpt": pt::text(body),
    slug,
    publishedAt,
    mainImage{asset, alt, crop, hotspot},
    categories[]->{_id, title, slug}
  }`

export default blogCategoriesQuery
