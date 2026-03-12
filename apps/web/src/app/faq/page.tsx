'use client';
import { PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

export default function FAQ() {
  const questionList = [
    {
      question: 'What makes this poker game different from traditional apps?',
      answer:
        'Unlike normal poker apps that rely on centralized servers, this game runs on blockchain. That means every shuffle, deal, and betting action is recorded on-chain, making it transparent and verifiable by anyone. Players don’t have to “trust” the platform; they can independently check fairness using public validation tools. This ensures a level of security and fairness that’s impossible to achieve with traditional centralized poker apps.',
    },
    {
      question: 'How do I create an account?',
      answer:
        "To create an account, simply click on the 'Sign Up' button on the homepage and follow the instructions to register using your email or social media accounts.",
    },
    {
      question: 'Is my personal information safe?',
      answer:
        'Yes, we prioritize your privacy and use advanced encryption methods to protect your personal information from unauthorized access.',
    },
    {
      question: 'What cryptocurrencies are accepted?',
      answer:
        'We accept a variety of cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), and our native token POKER.',
    },
    {
      question: 'How do I deposit funds?',
      answer:
        "You can deposit funds by navigating to the 'Wallet' section of your account and selecting the 'Deposit' option. Follow the prompts to complete your transaction.",
    },
    {
      question: 'Are there any fees for playing?',
      answer:
        "Yes, there are small fees associated with each game to cover operational costs. Please refer to our 'Fees' page for detailed information.",
    },
    {
      question: 'How do I withdraw my winnings?',
      answer:
        "To withdraw your winnings, go to the 'Wallet' section and select 'Withdraw'. Enter the amount you wish to withdraw and follow the instructions.",
    },
    {
      question: 'What measures are in place to ensure fair play?',
      answer:
        'We use advanced cryptographic techniques and smart contracts to ensure that all games are fair and transparent. Additionally, our platform is regularly audited by third-party security firms.',
    },
    {
      question: 'Can I play on mobile devices?',
      answer:
        'Yes, our platform is fully optimized for mobile devices, allowing you to play poker on the go from your smartphone or tablet.',
    },
    {
      question: 'Who can I contact for support?',
      answer:
        "If you need assistance, our support team is available  24/7. You can reach us via the 'Contact Us' page or through our live chat feature on the website.",
    },
  ];

  const QuestionAnswer = ({
    question,
    answer,
  }: {
    question: string;
    answer: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div
        className="flex flex-col p-5 border-b border-[#E6E8EC] rounded-md hover:cursor-pointer hover:bg-gray-100 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-row items-center justify-between">
          <p className="text-lg font-['roboto-semibold'] text-[#353945]">
            {question}
          </p>
          <div className="p-0 h-[20px]">
            {isOpen ? (
              <XIcon
                color="#3772FF"
                className="transform animate-in spin-in fade-in-750"
              />
            ) : (
              <PlusIcon
                color="#777E90"
                className="transform animate-in spin-in fade-in-750"
              />
            )}
          </div>
        </div>

        {isOpen ? (
          <p className="transform animate-in slide-in-from-top-2 text-base font-['roboto'] text-[#777E90] mt-3">
            {answer}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] py-8 w-full h-full">
      <div className="container mx-auto px-1 md:px-10">
        <p className="text-2xl md:text-4xl mt-4 md:mt-2 mb-8 md:mb-10 font-['roboto-semibold'] text-[#23262F] pl-5">
          Frequently Asked Questions
        </p>
        <div className="mt-6">
          {questionList.map((item, index) => (
            <div key={index}>
              <QuestionAnswer question={item.question} answer={item.answer} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
