// TODO: Trang mua sắm — chưa implement
// Hiện tại HomeCarousel link đến route này nhưng chưa có nội dung
export default function MuaSamPage() {
  return (
    <div className="flex min-h-[calc(100vh-97px)] w-full items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">MUA SẮM</h1>
        <p className="text-muted-foreground">Tính năng đang được phát triển</p>
        <p className="text-sm text-muted-foreground">
          Vui lòng liên hệ hotline{' '}
          <a href="tel:0703334443" className="underline">
            0703 334 443
          </a>
        </p>
      </div>
    </div>
  );
}
