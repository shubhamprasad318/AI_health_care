import React from "react";

function FAQ() {
  return (
    <div className="md:h-full h-screen w-full font-text my-10">
      <div className="">
        <div className=" p-8">
          <h2 className="mb-16 h text-4xl font-extrabold leading-9 border-b-2 text-lightText border-lightText">
            FAQs
          </h2>
          <div className="flex h-full justify-between flex-col md:flex-row">
            <div className="flex  w-full px-4">
              <ul className="flex flex-col  items-start gap-8 font-nunito text-sm">
                <li className="">
                  <p className="md:text-lg font-medium leading-6 text-gray-600 ">
                    What is the AI HealthEngine, and how does it work?
                  </p>
                  <p className="mt-2">
                    <p className="md:text-base leading-6 text-gray-500">
                      The AI HealthEngine uses advanced AI to personalize
                      healthcare. text-base text-base text-base text-baseIt
                      analyzes data for tailored insights, providing proactive
                      wellness tips and condition-specific guidance.
                    </p>
                  </p>
                </li>

                <li className="">
                  <p className="md:text-lg font-medium leading-6 text-gray-600">
                    Is my data secure and private?
                  </p>
                  <p className="mt-2">
                    <p className="md:text-base leading-6 text-gray-500">
                      Yes, we prioritize data security and privacy specifically
                      within the AI HealthEngine module, implementing stringent
                      measures to protect your information.
                    </p>
                  </p>
                </li>
              </ul>
            </div>
            <div className="flex w-full px-4">
              <ul className="flex flex-col  items-start gap-8 font-nunito text-sm ">
                <li className="">
                  <p className="md:text-lg font-medium leading-6 text-gray-600">
                    How can I get started with the AI HealthEngine?
                  </p>
                  <p className="mt-2">
                    <p className="md:text-base leading-6 text-gray-500">
                      Simply sign up, create an account, and follow the
                      straightforward onboarding process to start benefiting
                      from the AI HealthEngine.
                    </p>
                  </p>
                </li>
                <li className="">
                  <p className="md:text-lg font-medium leading-6 text-gray-600">
                    Is customer support available?
                  </p>
                  <p className="mt-2">
                    <p className="md:text-base leading-6 text-gray-500">
                      Absolutely, our dedicated customer support team is
                      available to assist you. Contact us through our provided
                      channels, and we'll address your questions or concerns
                      promptly.
                    </p>
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
