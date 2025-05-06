import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal,Tabs, message, Form, Table, Switch,Space,Button } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDateRange } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import Temlates from './components/Temlates';
import Resources from './components/Resources';
import TagSelector from '@/components/TagSelector/TagSelector';
import {
    statusOrder,
    difficultyOrder,
    mockWorkoutsForList,
    filterSections,
    BATCH_FILE_OPTIONS,
    MOCK_LANG_OPTIONS
} from './Data';

export default function WorkoutsList() {
    const onChange = key => {
        console.log(key);
      };
      const items = [
        {
          key: '1',
          label: 'Temlates',
          children: <Temlates></Temlates>,
        },
        {
          key: '2',
          label: 'Resources',
          children: <Resources></Resources>,
        }
      ];
      return <Tabs defaultActiveKey="1" items={items} onChange={onChange} />;
}   