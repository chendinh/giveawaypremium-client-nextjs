export default async function HomePage({ params: { locale } }) {
  console.log('locale:', locale);
  return <>Hello, {locale}!</>;
}
