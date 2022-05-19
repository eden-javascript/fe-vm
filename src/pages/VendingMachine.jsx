import React, { useState, useContext } from 'react';
import styled from 'styled-components';

import items from '../store/store';
import Button from '../components/Button';
import AvailableButton from '../components/AvailableButton';
import Input from '../components/Input';
import ProgressBoard from '../components/ProgressBoard';
import { MoneyContext } from '../context/MoneyProvider';
import makeTotalPrice from './utils/utils';

export default function VendingMachine() {
  const [accumulatedItemPrice, setAccumulatedItemPrice] = useState(0);
  const { inputPrice, setInputPrice, moneyInfos, setMoneyInfos } =
    useContext(MoneyContext);
  const [content, setContent] = useState(0);
  const [progressMsg, setProgressMsg] = useState(
    inputPrice.map((price) => `${price}원이 투입되었습니다.`)
  );

  const findTargetMoneyInfo = (price, infos) => {
    let money = price;
    infos.reverse();
    return infos.map(({ type }) => {
      const num = Math.floor(money / type);
      money %= type;
      return {
        type,
        num,
      };
    });
  };

  const updateMoneyInfo = ({ targetInfos, isPlus }) => {
    const newInfos = moneyInfos.map((info, index) => {
      const { type, num } = targetInfos[index];
      if (info.type === type && num > 0) {
        return {
          type,
          num: isPlus ? info.num + num : info.num - num,
        };
      }

      return { type: info.type, num: info.num };
    });

    return newInfos;
  };

  const decreaseWalletMoney = (price) => {
    const targetInfos = findTargetMoneyInfo(price, moneyInfos);
    const newMoneyInfos = updateMoneyInfo({ targetInfos, isPlus: false });
    newMoneyInfos.reverse();

    return newMoneyInfos;
  };

  const addRefund2MoneyInfo = (price) => {
    const refundMoneyInfo = findTargetMoneyInfo(price, moneyInfos);

    const newMoneyInfos = updateMoneyInfo({
      targetInfos: refundMoneyInfo,
      isPlus: true,
    });
    newMoneyInfos.reverse();

    return newMoneyInfos;
  };

  const handleChangeInput = ({ currentTarget }) => {
    setContent(currentTarget.textContent);
  };

  const handleClickSave = () => {
    if (Number.isNaN(Number(content))) {
      window.alert('숫자만 입력 가능합니다.');
      return;
    }

    if (Number(content) < 10) {
      window.alert('10원 이상 추가해야합니다.');
      return;
    }

    // Todo : 지갑에 요금의 개수가 없거나 지갑 전체 요금보다 큰 경우 예외처리
    const currentPrice = Number(content);
    setInputPrice([...inputPrice, Number(currentPrice)]);
    setMoneyInfos([...decreaseWalletMoney(Number(currentPrice))]);
    setProgressMsg([...progressMsg, `${currentPrice}원이 투입되었습니다.`]);
  };

  const handleSelectItem = (title, price) => {
    const currentRemainMoney =
      makeTotalPrice(moneyInfos) - (accumulatedItemPrice + price);
    if (currentRemainMoney < 0) {
      window.alert('요금을 초과하였습니다.');
      return;
    }

    setAccumulatedItemPrice(accumulatedItemPrice + price);
    setProgressMsg([...progressMsg, `${title}가 선택되었습니다.`]);
  };

  const handleClickReturnRemain = () => {
    const currentRemainMoney =
      inputPrice.reduce(
        (previousValue, currentValue) =>
          Number(previousValue) + Number(currentValue),
        []
      ) - accumulatedItemPrice;
    setInputPrice([]);
    setProgressMsg([
      ...progressMsg,
      `잔돈 ${currentRemainMoney}원이 반환됩니다.`,
    ]);
    const newMoneyInfos = addRefund2MoneyInfo(currentRemainMoney);
    setMoneyInfos([...newMoneyInfos]);
  };

  return (
    <StyledContainer>
      <StyledItems>
        {items.map(({ title, price }) => (
          <StyledItem key={`vm-item-${title}`}>
            <AvailableButton
              icon={title}
              isAvailabe={
                inputPrice.length > 0 && makeTotalPrice(moneyInfos) >= price
              }
              disabled={
                !(inputPrice.length > 0 && makeTotalPrice(moneyInfos) >= price)
              }
              onClick={() => handleSelectItem(title, price)}
            />
            <StyledPrice>{price}</StyledPrice>
          </StyledItem>
        ))}
      </StyledItems>
      <StyledController>
        <Input
          price={inputPrice[inputPrice.length - 1]}
          onChangeInput={handleChangeInput}
          onClickSave={handleClickSave}
        />
        <Button icon="반환" onClick={handleClickReturnRemain} />
        <ProgressBoard progressMsg={progressMsg} />
      </StyledController>
    </StyledContainer>
  );
}
const CONTAINER_SIZE = 500;

const StyledContainer = styled.div`
  display: flex;
`;

const StyledItems = styled.ul`
  display: flex;
  width: ${CONTAINER_SIZE}px;
  flex-wrap: wrap;
`;

const StyledItem = styled.li`
  width: ${CONTAINER_SIZE / 4}px;
  display: flex;
  flex-direction: column;
`;

const StyledController = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledPrice = styled.span`
  text-align: center;
`;
